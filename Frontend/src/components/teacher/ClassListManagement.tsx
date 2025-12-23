import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Search, Filter, Upload, Download, CheckSquare, Square } from 'lucide-react';
import { api } from '../../api/client';
import { ClassInfo, ImportSummary } from '../../api/types';

interface Student {
  id: string;
  studentCode: string;
  name: string;
  gender: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  students: Student[];
}

// Mock classes removed. Integrate real data via props or API.

export function ClassListManagement({ teacherId }: { teacherId: number | null }) {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'all' | string>('all');
  const [academicYears, setAcademicYears] = useState<Array<{ MaNH: number; Nam1: number; Nam2: number; name: string }>>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [semesters, setSemesters] = useState<Array<{ MaHK: number; TenHK: string }>>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [grades, setGrades] = useState<Array<{ MaKL: number; TenKL: string }>>([]);
  const [formData, setFormData] = useState<{
    MaHocSinh: string;
    HoTen: string;
    GioiTinh: string;
    NgaySinh: string;
    Email: string;
    SDT: string;
    DiaChi: string;
  }>({
    MaHocSinh: '',
    HoTen: '',
    GioiTinh: 'Nam',
    NgaySinh: '',
    Email: '',
    SDT: '',
    DiaChi: '',
  });
  const [notify, setNotify] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Load years, semesters, grades on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[ClassListManagement] Loading initial data...');
        
        const [years, sems, grs] = await Promise.all([
          api.listAcademicYears(),
          api.listSemesters(),
          api.listGrades(),
        ]);

        console.log('[ClassListManagement] Loaded:', { years, sems, grs });

        const mappedYears = (years || []).map((y: any) => ({ MaNH: y.MaNH, Nam1: y.Nam1, Nam2: y.Nam2, name: `${y.Nam1}-${y.Nam2}` }))
          .sort((a: any, b: any) => b.Nam1 - a.Nam1);
        setAcademicYears(mappedYears);
        const defaultYearId = mappedYears[0]?.MaNH ?? null;
        setSelectedYearId(defaultYearId);

        setSemesters((sems || []).map((s: any) => ({ MaHK: s.MaHK, TenHK: s.TenHK })));
        if (sems && sems.length > 0) setSelectedSemester(String(sems[0].MaHK));

        setGrades((grs || []).map((g: any) => ({ MaKL: g.MaKL, TenKL: g.TenKL })));

        const firstSemester = sems && sems.length > 0 ? String(sems[0].MaHK) : null;
        if (firstSemester) setSelectedSemester(firstSemester);

    // Load classes for default year
        console.log('[ClassListManagement] Loading classes with params:', { 
          MaNamHoc: String(defaultYearId), 
          MaHocKy: firstSemester 
        });
        
        const classData = await api.getTeacherClasses(
          defaultYearId && firstSemester 
            ? { MaNamHoc: String(defaultYearId), MaHocKy: firstSemester } 
            : undefined
        );
        
        console.log('[ClassListManagement] Loaded classes:', classData);
        setClasses(classData || []);
      } catch (err: any) {
        console.error('[ClassListManagement] Error loading data:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu ban đầu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reload classes when academic year changes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[ClassListManagement] Reloading classes with filters:', { 
          MaNamHoc: String(selectedYearId), 
          MaHocKy: selectedSemester 
        });
        
        const classData = await api.getTeacherClasses(
          selectedYearId 
            ? { MaNamHoc: String(selectedYearId), MaHocKy: selectedSemester } 
            : undefined
        );
        
        console.log('[ClassListManagement] Reloaded classes:', classData);
        setClasses(classData || []);
      } catch (err: any) {
        console.error('[ClassListManagement] Error reloading classes:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải danh sách lớp');
      } finally {
        setLoading(false);
      }
    };
    if (selectedYearId) {
      loadClasses();
    }
  }, [selectedYearId, selectedSemester]);

  const handleSelectClass = async (classItem: ClassInfo) => {
    setSelectedClass(classItem);
    setIsAddingStudent(false);
    setEditingStudentId(null);
    setImportResult(null);
    setImportFile(null);
    setSelectedStudents(new Set());
    
    // Fetch students for this class and selected semester
    if (selectedSemester) {
      try {
        const students = await api.getStudentsByClass(classItem.MaLop, selectedSemester);
        setSelectedClass({ ...classItem, DanhSachHocSinh: students });
      } catch (err: any) {
        console.error('Failed to load students:', err);
        setNotify('Không thể tải danh sách học sinh');
        setTimeout(() => setNotify(null), 3000);
      }
    }
  };

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      // Check age (15-20)
      const birthDate = new Date(formData.NgaySinh);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 15 || age > 20) {
        alert('Tuổi học sinh phải từ 15 đến 20');
        return;
      }

      // Check class capacity
      if (!editingStudentId && (selectedClass.DanhSachHocSinh?.length ?? 0) >= 40) {
        alert('Lớp đã đủ sĩ số (tối đa 40 học sinh)');
        return;
      }

      if (editingStudentId) {
        // Update student
        await api.updateStudent(editingStudentId, {
          MaHocSinh: formData.MaHocSinh,
          HoTen: formData.HoTen,
          GioiTinh: formData.GioiTinh,
          NgaySinh: formData.NgaySinh,
          Email: formData.Email,
          SDT: formData.SDT,
          DiaChi: formData.DiaChi,
        });
        setNotify('Cập nhật học sinh thành công');
      } else {
        // Add student to class/semester - use selected semester ID from DB
        const hocKyId = selectedSemester || '1';
        const result = await api.addStudentToClass(selectedClass.MaLop, hocKyId, {
          MaHocSinh: formData.MaHocSinh,
          HoTen: formData.HoTen,
          GioiTinh: formData.GioiTinh,
          NgaySinh: formData.NgaySinh,
          Email: formData.Email,
          SDT: formData.SDT,
          DiaChi: formData.DiaChi,
        });
        if (result && (result as any).createdAccount) {
          const ca = (result as any).createdAccount;
          setNotify(`Thêm học sinh thành công. Đã tạo tài khoản ${ca.TenDangNhap} và gửi email tới ${ca.Email}.`);
        } else {
          setNotify('Thêm học sinh vào lớp thành công');
        }
      }

      // Reload students for the current class
      if (selectedSemester) {
        const students = await api.getStudentsByClass(selectedClass.MaLop, selectedSemester);
        setSelectedClass({ ...selectedClass, DanhSachHocSinh: students });
      }

      setIsAddingStudent(false);
      setEditingStudentId(null);
      setFormData({
        MaHocSinh: '',
        HoTen: '',
        GioiTinh: 'Nam',
        NgaySinh: '',
        Email: '',
        SDT: '',
        DiaChi: '',
      });

      // Auto-hide notification after 5s
      setTimeout(() => setNotify(null), 5000);
    } catch (err) {
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Không thể thêm/cập nhật học sinh'));
    }
  };

  const handleEditStudent = (student: any) => {
    setEditingStudentId(student.MaHocSinh);
    setFormData({
      MaHocSinh: student.MaHocSinh,
      HoTen: student.HoTen,
      GioiTinh: student.GioiTinh,
      NgaySinh: student.NgaySinh,
      Email: student.Email || '',
      SDT: student.SDT || '',
      DiaChi: student.DiaChi || '',
    });
    setIsAddingStudent(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedClass) return;
    if (!confirm('Bạn có chắc chắn muốn xóa học sinh này?')) return;

    try {
      await api.deleteStudent(studentId);

      // Reload students for the current class
      if (selectedSemester) {
        const students = await api.getStudentsByClass(selectedClass.MaLop, selectedSemester);
        setSelectedClass({ ...selectedClass, DanhSachHocSinh: students });
      }
      setNotify('Xóa học sinh thành công');
      setTimeout(() => setNotify(null), 3000);
    } catch (err) {
      alert('Lỗi: ' + (err instanceof Error ? err.message : 'Không thể xóa học sinh'));
    }
  };

  const handleDownloadStudentTemplate = () => {
    const csv = [
      ['Mã học sinh', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Email', 'Số điện thoại', 'Địa chỉ'].join(','),
      ['HS0001', 'Hoàng Gia An', 'Nam', '04/05/2008', 'hoanggiaan1@example.com', '0181960013', '60 Nguyễn Huệ, Phương 7, Quận 1, Hải Phòng'].join(','),
      ['HS0002', 'Đặng Đức Sơn', 'Nam', '05/26/2011', 'dangducson2@example.com', '0026542351', '24 Hai Bà Trưng, Phương 1, Quận 5, Đà Nẵng'].join(','),
      ['HS0003', 'Đặng Bảo Chi', 'Nữ', '02/13/2011', 'dangbaochi3@example.com', '0184959310', '170 Điện Biên Phủ, Phương 3, Quận 1, Hà Nội'].join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportStudents = async () => {
    if (!selectedClass || !selectedSemester) {
      alert('Chọn lớp và học kỳ trước khi nhập file');
      return;
    }
    if (!importFile) {
      alert('Vui lòng chọn file CSV/XLSX');
      return;
    }
    setImporting(true);
    setNotify(null);
    setImportResult(null);
    try {
      const result = await api.importStudents(String(selectedClass.MaLop), selectedSemester, importFile);
      setImportResult(result as ImportSummary);
      const students = await api.getStudentsByClass(selectedClass.MaLop, selectedSemester);
      setSelectedClass({ ...selectedClass, DanhSachHocSinh: students });
      setNotify('Nhập danh sách học sinh thành công');
    } catch (err: any) {
      setNotify(err.response?.data?.message || err.message || 'Không thể nhập danh sách');
    } finally {
      setImporting(false);
      setTimeout(() => setNotify(null), 5000);
    }
  };

  const filteredStudents = selectedClass?.DanhSachHocSinh?.filter((s) =>
    s.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.MaHocSinh.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const studentIds = new Set(filteredStudents.map(s => s.MaHocSinh));
  const allStudentsSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.MaHocSinh));
  const someStudentsSelected = filteredStudents.some(s => selectedStudents.has(s.MaHocSinh));

  const handleSelectAllStudents = () => {
    if (allStudentsSelected) {
      filteredStudents.forEach(s => selectedStudents.delete(s.MaHocSinh));
      setSelectedStudents(new Set(selectedStudents));
    } else {
      const newSelected = new Set(selectedStudents);
      filteredStudents.forEach(s => newSelected.add(s.MaHocSinh));
      setSelectedStudents(newSelected);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudents.size === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedStudents.size} học sinh đã chọn?`)) return;

    setLoading(true);
    let deleted = 0;
    let failed = 0;

    for (const studentId of selectedStudents) {
      try {
        await api.deleteStudent(studentId);
        deleted += 1;
      } catch (err) {
        failed += 1;
      }
    }

    setSelectedStudents(new Set());
    if (selectedClass && selectedSemester) {
      const students = await api.getStudentsByClass(selectedClass.MaLop, selectedSemester);
      setSelectedClass({ ...selectedClass, DanhSachHocSinh: students });
    }
    setLoading(false);
    alert(`Đã xóa ${deleted} học sinh. ${failed > 0 ? failed + ' lỗi.' : ''}`);
  };

  // Check if current teacher is subject teacher only (no homeroom role)
  const isSubjectTeacherOnly = selectedClass?.roles && 
    selectedClass.roles.includes('subject') && 
    !selectedClass.roles.includes('homeroom');

  // Debug log
  console.log('[ClassListManagement] Selected class:', selectedClass);
  console.log('[ClassListManagement] Roles:', selectedClass?.roles);
  console.log('[ClassListManagement] isSubjectTeacherOnly:', isSubjectTeacherOnly);

  const filteredClasses = (classes || []).filter(
    (c) =>
      c.TenLop?.toLowerCase().includes(classSearchTerm.toLowerCase()) &&
      (selectedGrade === 'all' || String(c.MaKhoiLop) === selectedGrade)
  );

  // If there's an error and no data loaded, show error state
  if (error && !loading && classes.length === 0) {
    return (
      <div>
        <h1 className="text-green-900 mb-6">Quản lý danh sách lớp</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-2">❌ Lỗi: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-green-900 mb-6">Quản lý danh sách lớp</h1>

      {loading && <div className="text-green-600 mb-4">Đang tải dữ liệu...</div>}
      {error && <div className="text-red-600 mb-4">Lỗi: {error}</div>}
      {notify && (
        <div className="mb-4 p-3 rounded-md bg-green-50 text-green-800 border border-green-200">{notify}</div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <h2 className="text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-green-600" />
          Tra cứu danh sách lớp
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Năm học</label>
            <select
              value={selectedYearId ?? ''}
              onChange={(e) => setSelectedYearId(Number(e.target.value) || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Chọn năm học --</option>
              {academicYears.map((y) => (
                <option key={y.MaNH} value={y.MaNH}>{y.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {semesters.map((s) => (
                <option key={s.MaHK} value={String(s.MaHK)}>{s.TenHK}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Tìm kiếm theo tên lớp</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Nhập tên lớp (VD: 10A1)..."
                value={classSearchTerm}
                onChange={(e) => setClassSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Lọc theo khối</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tất cả khối</option>
                {grades.map((g) => (
                  <option key={g.MaKL} value={String(g.MaKL)}>{g.TenKL}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <span>Tổng số lớp: <strong className="text-gray-900">{filteredClasses.length}</strong></span>
          <span>Tổng số học sinh: <strong className="text-gray-900">{filteredClasses.reduce((sum, c) => sum + (c.DanhSachHocSinh?.length ?? 0), 0)}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h2 className="text-gray-900 mb-4">Danh sách lớp</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredClasses.length > 0 ? (
              filteredClasses.map(classItem => (
                <button
                  key={classItem.MaLop}
                  onClick={() => handleSelectClass(classItem)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedClass?.MaLop === classItem.MaLop
                      ? 'bg-green-100 border-2 border-green-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-gray-900">{classItem.TenLop}</p>
                      <p className="text-gray-600">Khối: {(classItem as any).TenKhoiLop || classItem.MaKhoiLop} • HS: {(classItem as any).SoLuongHocSinh ?? classItem.DanhSachHocSinh?.length ?? 0}</p>
                      {classItem.roles && classItem.roles.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {classItem.roles.includes('homeroom') && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">GVCN</span>
                          )}
                          {classItem.roles.includes('subject') && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Dạy môn</span>
                          )}
                        </div>
                      )}
                      {classItem.subjects && classItem.subjects.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Môn: {classItem.subjects.map((s) => s.TenMonHoc).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Không tìm thấy lớp nào</p>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedClass ? (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-gray-900">Lớp {selectedClass.TenLop}</h2>
                  {isSubjectTeacherOnly && (
                    <p className="text-sm text-orange-600 mt-1">
                      <span className="bg-orange-100 px-2 py-1 rounded">🔒 Chế độ chỉ xem (Giáo viên bộ môn)</span>
                    </p>
                  )}
                </div>
                {!isAddingStudent && !isSubjectTeacherOnly && (
                  <button
                    onClick={() => setIsAddingStudent(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm học sinh
                  </button>
                )}
              </div>

              {!isSubjectTeacherOnly && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-800">
                  <Upload className="w-4 h-4 text-green-700" />
                  <div>
                    <p className="font-medium">Nhập học sinh từ CSV/Excel</p>
                    <p className="text-sm text-gray-600">Cột bắt buộc: Mã học sinh, Họ và tên, Giới tính, Ngày sinh (định dạng MM/DD/YYYY).</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                  <input
                    type="file"
                    accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleImportStudents}
                      disabled={importing}
                      className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {importing ? 'Đang nhập...' : 'Nhập file'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadStudentTemplate}
                      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200"
                    >
                      <Download className="w-4 h-4" />
                      Tải mẫu CSV
                    </button>
                  </div>
                </div>
                {importResult && (
                  <div className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-lg p-3">
                    <p>Kết quả: {importResult.imported}/{importResult.total} thành công, {importResult.failed} lỗi.</p>
                    {importResult.errors.length > 0 && (
                      <ul className="list-disc list-inside text-red-700 mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <li key={`${err.row}-${idx}`}>Dòng {err.row}: {err.message}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="text-red-600">... và {importResult.errors.length - 5} lỗi khác</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              )}

              {isAddingStudent && !isSubjectTeacherOnly && (
                <form onSubmit={handleSubmitStudent} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-gray-900 mb-3">
                    {editingStudentId ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Mã học sinh"
                      value={formData.MaHocSinh}
                      onChange={(e) => setFormData({ ...formData, MaHocSinh: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      value={formData.HoTen}
                      onChange={(e) => setFormData({ ...formData, HoTen: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <select
                      value={formData.GioiTinh}
                      onChange={(e) => setFormData({ ...formData, GioiTinh: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                    <input
                      type="date"
                      value={formData.NgaySinh}
                      onChange={(e) => setFormData({ ...formData, NgaySinh: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.Email}
                      onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={formData.SDT}
                      onChange={(e) => setFormData({ ...formData, SDT: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Địa chỉ"
                      value={formData.DiaChi}
                      onChange={(e) => setFormData({ ...formData, DiaChi: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 col-span-2"
                      required
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      {editingStudentId ? 'Cập nhật' : 'Thêm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingStudent(false);
                        setEditingStudentId(null);
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm học sinh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {!isSubjectTeacherOnly && selectedStudents.size > 0 && (
                <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm text-gray-700">
                    {selectedStudents.size} học sinh được chọn
                  </span>
                  <button
                    onClick={handleBulkDeleteStudents}
                    className="flex items-center gap-2 bg-white border-2 border-red-600 text-red-600 px-3 py-1 rounded hover:bg-red-50 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa {selectedStudents.size}
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {!isSubjectTeacherOnly && (
                      <th className="px-4 py-3 w-10">
                        <button
                          onClick={handleSelectAllStudents}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {allStudentsSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : someStudentsSelected ? (
                            <div className="w-5 h-5 border-2 border-gray-400 rounded opacity-50" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                      )}
                      <th className="px-4 py-3 text-left text-gray-700">Mã HS</th>
                      <th className="px-4 py-3 text-left text-gray-700">Họ và tên</th>
                      <th className="px-4 py-3 text-left text-gray-700">Giới tính</th>
                      <th className="px-4 py-3 text-left text-gray-700">Ngày sinh</th>
                      {!isSubjectTeacherOnly && (
                      <th className="px-4 py-3 text-left text-gray-700">Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.MaHocSinh} className="hover:bg-gray-50">
                        {!isSubjectTeacherOnly && (
                        <td className="px-4 py-3 w-10">
                          <button
                            onClick={() => handleSelectStudent(student.MaHocSinh)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {selectedStudents.has(student.MaHocSinh) ? (
                              <CheckSquare className="w-5 h-5 text-green-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        )}
                        <td className="px-4 py-3 text-gray-900">{student.MaHocSinh}</td>
                        <td className="px-4 py-3 text-gray-900">{student.HoTen}</td>
                        <td className="px-4 py-3 text-gray-600">{student.GioiTinh}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(student.NgaySinh).toLocaleDateString('vi-VN')}
                        </td>
                        {!isSubjectTeacherOnly && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.MaHocSinh)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-sm text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chọn một lớp để xem danh sách học sinh</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}