import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Users, Trash2, Edit, UserCheck, BookOpen, Filter } from 'lucide-react';

interface SubjectTeacher {
  MaBangDiemMon: number;
  MaMon: number;
  TenMonHoc: string | null;
  MaHocKy: number;
  TenHocKy: string | null;
  MaGV: number;
  HoVaTenGV: string | null;
  EmailGV: string | null;
}

interface ClassAssignment {
  MaLop: number;
  TenLop: string;
  MaKhoiLop: number;
  TenKhoiLop: string | null;
  MaNamHoc: number;
  NamHoc: string | null;
  MaGVCN: number | null;
  HoVaTenGVCN: string | null;
  EmailGVCN: string | null;
  subjectTeachers: SubjectTeacher[];
}

export function ClassAssignmentManagement() {
  const [classes, setClasses] = useState<ClassAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<Array<{ MaNH: number; Nam1: number; Nam2: number }>>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [grades, setGrades] = useState<Array<{ MaKL: number; TenKL: string }>>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [expandedClass, setExpandedClass] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [years, gradesList] = await Promise.all([
          api.listAcademicYears(),
          api.listGrades(),
        ]);
        
        const mappedYears = (years || []).sort((a: any, b: any) => b.Nam1 - a.Nam1);
        setAcademicYears(mappedYears);
        setSelectedYear(mappedYears[0]?.MaNH || null);
        
        setGrades(gradesList || []);
      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadClassAssignments();
    }
  }, [selectedYear, selectedGrade]);

  const loadClassAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { MaNamHoc: selectedYear };
      if (selectedGrade !== 'all') params.MaKhoiLop = Number(selectedGrade);
      
      const data = await api.getClassAssignments(params);
      setClasses(data || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phân công');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHomeroomTeacher = async (MaLop: number, TenLop: string) => {
    if (!confirm(`Xác nhận xóa giáo viên chủ nhiệm của lớp ${TenLop}?`)) return;
    
    try {
      await api.removeHomeroomTeacher(MaLop);
      alert('Đã xóa giáo viên chủ nhiệm');
      loadClassAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Không thể xóa');
    }
  };

  const handleRemoveSubjectTeacher = async (MaBangDiemMon: number, teacherName: string, subjectName: string) => {
    if (!confirm(`Xác nhận xóa phân công giáo viên ${teacherName} dạy ${subjectName}?`)) return;
    
    try {
      await api.removeSubjectTeacher(MaBangDiemMon);
      alert('Đã xóa phân công giáo viên bộ môn');
      loadClassAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Không thể xóa');
    }
  };

  const filteredClasses = classes;

  return (
    <div>
      <h1 className="text-indigo-900 mb-6">Quản lý phân công giáo viên</h1>

      {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 border border-red-200">{error}</div>}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <h2 className="text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          Bộ lọc
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Năm học</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {academicYears.map((y) => (
                <option key={y.MaNH} value={y.MaNH}>{y.Nam1}-{y.Nam2}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Khối</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả khối</option>
              {grades.map((g) => (
                <option key={g.MaKL} value={g.MaKL}>{g.TenKL}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="text-indigo-600 mb-4">Đang tải dữ liệu...</div>}

      {/* Class List */}
      <div className="space-y-4">
        {filteredClasses.map((cls) => (
          <div key={cls.MaLop} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div 
              className="p-4 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors"
              onClick={() => setExpandedClass(expandedClass === cls.MaLop ? null : cls.MaLop)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-gray-900 font-medium">{cls.TenLop}</h3>
                    <p className="text-sm text-gray-600">
                      Khối: {cls.TenKhoiLop} • Năm học: {cls.NamHoc}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {expandedClass === cls.MaLop ? '▼' : '▶'}
                </div>
              </div>
            </div>

            {expandedClass === cls.MaLop && (
              <div className="p-4 space-y-4">
                {/* Homeroom Teacher */}
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-gray-900 font-medium flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Giáo viên chủ nhiệm
                    </h4>
                  </div>
                  {cls.MaGVCN ? (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div>
                        <p className="text-gray-900">{cls.HoVaTenGVCN}</p>
                        <p className="text-sm text-gray-600">{cls.EmailGVCN}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveHomeroomTeacher(cls.MaLop, cls.TenLop)}
                        className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                        title="Xóa GVCN"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Chưa phân công GVCN</p>
                  )}
                </div>

                {/* Subject Teachers */}
                <div>
                  <h4 className="text-gray-900 font-medium flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Giáo viên bộ môn ({cls.subjectTeachers.length})
                  </h4>
                  {cls.subjectTeachers.length > 0 ? (
                    <div className="space-y-2">
                      {cls.subjectTeachers.map((st) => (
                        <div key={st.MaBangDiemMon} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{st.TenMonHoc || 'Môn học'}</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {st.TenHocKy || `HK${st.MaHocKy}`}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{st.HoVaTenGV}</p>
                            <p className="text-xs text-gray-600">{st.EmailGV}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveSubjectTeacher(st.MaBangDiemMon, st.HoVaTenGV || '', st.TenMonHoc || '')}
                            className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            title="Xóa phân công"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Chưa phân công giáo viên bộ môn</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {!loading && filteredClasses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Không có lớp nào trong năm học và khối đã chọn
          </div>
        )}
      </div>
    </div>
  );
}
