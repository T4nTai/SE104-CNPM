import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { api } from '../../api/client';

export function RegulationManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Academic year states
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Semester states
  const [semesters, setSemesters] = useState<any[]>([]);
  const [isAddingSemester, setIsAddingSemester] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState<number | null>(null);
  const [semesterFormData, setSemesterFormData] = useState({
    TenHK: '',
  });

  // Subject states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjectFormData, setSubjectFormData] = useState({
    TenMonHoc: '',
    MaMon: '',
    HeSoMon: 1,
    MoTa: ''
  });

  // Grade states
  const [grades, setGrades] = useState<any[]>([]);
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [gradeFormData, setGradeFormData] = useState({
    TenKL: '',
    SoLop: 0,
  });

  // Class states
  const [classes, setClasses] = useState<any[]>([]);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [classFormData, setClassFormData] = useState({
    TenLop: '',
    MaKhoiLop: '',
    MaNamHoc: '',
    SiSo: 0,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([loadAcademicYears(), loadSemesters(), loadSubjects(), loadGrades(), loadClasses()]);
  };

  const loadAcademicYears = async () => {
    try {
      const data = await api.listAcademicYears();
      setAcademicYears(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load academic years:', err);
    }
  };

  // Academic year handlers
  const [yearFormData, setYearFormData] = useState({ Nam1: '', Nam2: '' });
  const handleSubmitAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await api.createAcademicYear({ Nam1: Number(yearFormData.Nam1), Nam2: Number(yearFormData.Nam2) });
      setYearFormData({ Nam1: '', Nam2: '' });
      await loadAcademicYears();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Không thể tạo năm học');
    } finally {
      setLoading(false);
    }
  };

  const loadSemesters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listSemesters();
      setSemesters(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách học kỳ');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listSubjects();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listGrades();
      setGrades(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khối lớp');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await api.listClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load classes:', err);
    }
  };

  // Semester handlers
  const handleSubmitSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (editingSemesterId) {
        await api.updateSemester(String(editingSemesterId), semesterFormData);
        setEditingSemesterId(null);
      } else {
        if (semesters.length >= 2) {
          setError('Chỉ được phép có 2 học kỳ (Học kỳ I và Học kỳ II)');
          return;
        }
        await api.createSemester(semesterFormData);
      }

      setSuccess(true);
      setIsAddingSemester(false);
      setSemesterFormData({
        TenHK: '',
      });
      await loadSemesters();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể lưu học kỳ');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSemester = (semester: any) => {
    setEditingSemesterId(semester.MaHK);
    setSemesterFormData({
      TenHK: semester.TenHK,
    });
    setIsAddingSemester(true);
  };

  const handleDeleteSemester = async (MaHK: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học kỳ này?')) return;

    try {
      setLoading(true);
      setError(null);
      await api.deleteSemester(String(MaHK));
      setSuccess(true);
      await loadSemesters();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể xóa học kỳ');
    } finally {
      setLoading(false);
    }
  };

  // Subject handlers
  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (editingSubjectId) {
        await api.updateSubject(String(editingSubjectId), subjectFormData);
        setEditingSubjectId(null);
      } else {
        await api.createSubject(subjectFormData);
      }

      setSuccess(true);
      setIsAddingSubject(false);
      setSubjectFormData({
        TenMonHoc: '',
        MaMon: '',
        HeSoMon: 1,
        MoTa: ''
      });
      await loadSubjects();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể lưu môn học');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubjectId(subject.MaMonHoc);
    setSubjectFormData({
      TenMonHoc: subject.TenMonHoc,
      MaMon: subject.MaMon || '',
      HeSoMon: subject.HeSoMon,
      MoTa: subject.MoTa || ''
    });
    setIsAddingSubject(true);
  };

  const handleDeleteSubject = async (MaMonHoc: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa môn học này?')) return;

    try {
      setLoading(true);
      setError(null);
      await api.deleteSubject(String(MaMonHoc));
      setSuccess(true);
      await loadSubjects();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể xóa môn học');
    } finally {
      setLoading(false);
    }
  };

  // Grade handlers
  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (editingGradeId) {
        await api.updateGrade(String(editingGradeId), gradeFormData);
        setEditingGradeId(null);
      } else {
        if (grades.length >= 3) {
          setError('Chỉ được phép có 3 khối lớp (10, 11, 12)');
          return;
        }
        await api.createGrade(gradeFormData);
      }

      setSuccess(true);
      setIsAddingGrade(false);
      setGradeFormData({
        TenKL: '',
        SoLop: 0,
      });
      await loadGrades();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể lưu khối lớp');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGrade = (grade: any) => {
    setEditingGradeId(grade.MaKL);
    setGradeFormData({
      TenKL: grade.TenKL,
      SoLop: grade.SoLop || 0,
    });
    setIsAddingGrade(true);
  };

  const handleDeleteGrade = async (MaKL: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khối lớp này?')) return;

    try {
      setLoading(true);
      setError(null);
      await api.deleteGrade(String(MaKL));
      setSuccess(true);
      await loadGrades();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể xóa khối lớp');
    } finally {
      setLoading(false);
    }
  };

  // Class handlers
  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (!classFormData.MaKhoiLop || !classFormData.MaNamHoc) {
        setError('Vui lòng chọn khối lớp và năm học');
        return;
      }

      // Check if grade has reached max classes
      const selectedGrade = grades.find(g => String(g.MaKL) === String(classFormData.MaKhoiLop));
      if (selectedGrade && selectedGrade.SoLop) {
        const classesInGrade = classes.filter(
          c => String(c.MaKhoiLop) === String(classFormData.MaKhoiLop) &&
               String(c.MaNamHoc) === String(classFormData.MaNamHoc)
        );
        if (classesInGrade.length >= selectedGrade.SoLop) {
          setError(`Khối ${selectedGrade.TenKL} đã đủ ${selectedGrade.SoLop} lớp cho năm học này`);
          return;
        }
      }

      await api.createClass({
        TenLop: classFormData.TenLop,
        MaKhoiLop: parseInt(classFormData.MaKhoiLop),
        MaNamHoc: parseInt(classFormData.MaNamHoc),
        SiSo: classFormData.SiSo || undefined,
      });

      setSuccess(true);
      setIsAddingClass(false);
      setClassFormData({
        TenLop: '',
        MaKhoiLop: '',
        MaNamHoc: '',
        SiSo: 0,
      });
      await loadClasses();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo lớp học');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (MaLop: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lớp này?')) return;

    try {
      setLoading(true);
      setError(null);
      await api.deleteClass(String(MaLop));
      setSuccess(true);
      await loadClasses();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Không thể xóa lớp học');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-indigo-900 mb-6">Quản lý quy định</h1>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Thao tác thành công!
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* SEMESTERS SECTION */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-900">Quản lý học kỳ</h2>
              {!isAddingSemester && semesters.length < 2 && (
                <button
                  onClick={() => setIsAddingSemester(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                  Thêm học kỳ
                </button>
              )}
            </div>

            {isAddingSemester && (
              <form onSubmit={handleSubmitSemester} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Tên học kỳ *</label>
                  <input
                    type="text"
                    value={semesterFormData.TenHK}
                    onChange={(e) => setSemesterFormData({ TenHK: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ví dụ: Học kỳ I"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Save className="w-4 h-4" />
                    {editingSemesterId ? 'Cập nhật' : 'Thêm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSemester(false);
                      setEditingSemesterId(null);
                      setSemesterFormData({ TenHK: '' });
                    }}
                    className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {semesters.map((semester) => (
                <div key={semester.MaHK} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-gray-900">{semester.TenHK}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSemester(semester)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSemester(semester.MaHK)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {semesters.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Chưa có học kỳ nào. Nhấn "Thêm học kỳ" để bắt đầu.
                </div>
              )}
            </div>
          </div>

          {/* ACADEMIC YEARS SECTION */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-900">Tạo năm học</h2>
            </div>

            <form onSubmit={handleSubmitAcademicYear} className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Năm bắt đầu *</label>
                  <input
                    type="number"
                    required
                    value={yearFormData.Nam1}
                    onChange={(e) => setYearFormData({ ...yearFormData, Nam1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Năm kết thúc *</label>
                  <input
                    type="number"
                    required
                    value={yearFormData.Nam2}
                    onChange={(e) => setYearFormData({ ...yearFormData, Nam2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="2025"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  disabled={loading}
                >
                  <Save className="w-4 h-4" />
                  Thêm năm học
                </button>
                <button
                  type="button"
                  onClick={() => setYearFormData({ Nam1: '', Nam2: '' })}
                  className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {academicYears.map((year) => (
                <div key={year.MaNH} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-900">{year.Nam1} - {year.Nam2}</div>
                  <span className="text-sm text-gray-600">Mã: {year.MaNH}</span>
                </div>
              ))}
              {academicYears.length === 0 && (
                <div className="text-center py-4 text-gray-500">Chưa có năm học nào</div>
              )}
            </div>
          </div>

          {/* SUBJECTS SECTION */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-900">Quản lý môn học</h2>
              {!isAddingSubject && (
                <button
                  onClick={() => setIsAddingSubject(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                  Thêm môn học
                </button>
              )}
            </div>

            {isAddingSubject && (
              <form onSubmit={handleSubmitSubject} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Tên môn học *</label>
                    <input
                      type="text"
                      value={subjectFormData.TenMonHoc}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, TenMonHoc: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ví dụ: Toán"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Mã môn (tùy chọn)</label>
                    <input
                      type="text"
                      value={subjectFormData.MaMon}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, MaMon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ví dụ: TOAN"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Hệ số môn *</label>
                    <input
                      type="number"
                      value={subjectFormData.HeSoMon}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, HeSoMon: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      min="1"
                      step="0.5"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={subjectFormData.MoTa}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, MoTa: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Save className="w-4 h-4" />
                    {editingSubjectId ? 'Cập nhật' : 'Thêm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSubject(false);
                      setEditingSubjectId(null);
                      setSubjectFormData({ TenMonHoc: '', MaMon: '', HeSoMon: 1, MoTa: '' });
                    }}
                    className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {subjects.map((subject) => (
                <div key={subject.MaMonHoc} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-gray-900">{subject.TenMonHoc}</div>
                    <div className="text-sm text-gray-600">
                      Hệ số: {subject.HeSoMon}
                      {subject.MaMon && ` • Mã: ${subject.MaMon}`}
                      {subject.MoTa && ` • ${subject.MoTa}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSubject(subject)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.MaMonHoc)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Chưa có môn học nào. Nhấn "Thêm môn học" để bắt đầu.
                </div>
              )}
            </div>
          </div>

          {/* GRADES SECTION */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-900">Quản lý khối lớp</h2>
              {!isAddingGrade && grades.length < 3 && (
                <button
                  onClick={() => setIsAddingGrade(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                  Thêm khối lớp
                </button>
              )}
            </div>

            {isAddingGrade && (
              <form onSubmit={handleSubmitGrade} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Tên khối lớp *</label>
                    <input
                      type="text"
                      value={gradeFormData.TenKL}
                      onChange={(e) => setGradeFormData({ ...gradeFormData, TenKL: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ví dụ: 10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Số lớp</label>
                    <input
                      type="number"
                      value={gradeFormData.SoLop}
                      onChange={(e) => setGradeFormData({ ...gradeFormData, SoLop: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Save className="w-4 h-4" />
                    {editingGradeId ? 'Cập nhật' : 'Thêm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingGrade(false);
                      setEditingGradeId(null);
                      setGradeFormData({ TenKL: '', SoLop: 0 });
                    }}
                    className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {grades.map((grade) => (
                <div key={grade.MaKL} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-gray-900">Khối {grade.TenKL}</div>
                    <div className="text-sm text-gray-600">Số lớp: {grade.SoLop || 0}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditGrade(grade)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGrade(grade.MaKL)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {grades.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Chưa có khối lớp nào. Nhấn "Thêm khối lớp" để bắt đầu.
                </div>
              )}
            </div>
          </div>

          {/* CLASSES SECTION */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-900">Quản lý lớp học</h2>
              {!isAddingClass && (
                <button
                  onClick={() => setIsAddingClass(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                  Thêm lớp học
                </button>
              )}
            </div>

            {isAddingClass && (
              <form onSubmit={handleSubmitClass} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Tên lớp *</label>
                    <input
                      type="text"
                      value={classFormData.TenLop}
                      onChange={(e) => setClassFormData({ ...classFormData, TenLop: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ví dụ: 10A1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Khối lớp *</label>
                    <select
                      value={classFormData.MaKhoiLop}
                      onChange={(e) => setClassFormData({ ...classFormData, MaKhoiLop: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Chọn khối --</option>
                      {grades.map((grade) => (
                        <option key={grade.MaKL} value={grade.MaKL}>
                          Khối {grade.TenKL} (Tối đa {grade.SoLop || 0} lớp)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Năm học *</label>
                    <select
                      value={classFormData.MaNamHoc}
                      onChange={(e) => setClassFormData({ ...classFormData, MaNamHoc: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Chọn năm học --</option>
                      {academicYears.map((year) => (
                        <option key={year.MaNH} value={year.MaNH}>
                          {year.Nam1}-{year.Nam2}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Sĩ số</label>
                    <input
                      type="number"
                      value={classFormData.SiSo}
                      onChange={(e) => setClassFormData({ ...classFormData, SiSo: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      placeholder="Để trống = tối đa theo tham số"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Save className="w-4 h-4" />
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingClass(false);
                      setClassFormData({ TenLop: '', MaKhoiLop: '', MaNamHoc: '', SiSo: 0 });
                    }}
                    className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {classes.map((cls: any) => {
                const grade = grades.find(g => g.MaKL === cls.MaKhoiLop);
                const year = academicYears.find(y => y.MaNH === cls.MaNamHoc);
                return (
                  <div key={cls.MaLop} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-gray-900">{cls.TenLop}</div>
                      <div className="text-sm text-gray-600">
                        Khối {grade?.TenKL || cls.MaKhoiLop} • Năm học {year ? `${year.Nam1}-${year.Nam2}` : cls.MaNamHoc}
                        {cls.SiSo && ` • Sĩ số: ${cls.SiSo}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteClass(cls.MaLop)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {classes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Chưa có lớp học nào. Nhấn "Thêm lớp học" để bắt đầu.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
