import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { Users, Trash2, UserCheck, BookOpen, Filter, UserPlus, Plus } from 'lucide-react';

interface Option<T = any> {
  value: string | number;
  label: string;
  raw?: T;
}

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

export function TeacherAssignmentManagement() {
  const [activeTab, setActiveTab] = useState<'assign' | 'manage'>('assign');

  // For assignment
  const [years, setYears] = useState<Option[]>([]);
  const [semesters, setSemesters] = useState<Option[]>([]);
  const [grades, setGrades] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);

  const [selectedYear, setSelectedYear] = useState<string | number>('');
  const [selectedSemester, setSelectedSemester] = useState<string | number>('');
  const [selectedGrade, setSelectedGrade] = useState<string | number>('');
  const [selectedClass, setSelectedClass] = useState<string | number>('');
  const [selectedSubject, setSelectedSubject] = useState<string | number>('');
  const [selectedHomeroomTeacher, setSelectedHomeroomTeacher] = useState<string | number>('');
  const [selectedSubjectTeacher, setSelectedSubjectTeacher] = useState<string | number>('');

  const [status, setStatus] = useState<string>('');

  // For management
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [managementYear, setManagementYear] = useState<number | null>(null);
  const [managementGrade, setManagementGrade] = useState<string>('all');
  const [expandedClass, setExpandedClass] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        const [yearList, semesterList, subjectList, gradeList, userList] = await Promise.all([
          api.listAcademicYears(),
          api.listSemesters(),
          api.listSubjects(),
          api.listGrades(),
          api.listNguoiDung(),
        ]);
        
        const mappedYears = yearList.map((y: any) => ({ value: y.MaNH, label: `${y.Nam1}-${y.Nam2}`, raw: y }));
        setYears(mappedYears);
        setSemesters(semesterList.map((hk: any) => ({ value: hk.MaHK, label: hk.TenHK })));
        setSubjects(subjectList.map((m: any) => ({ value: m.MaMonHoc, label: m.TenMonHoc })));
        setGrades(gradeList.map((kl: any) => ({ value: kl.MaKL, label: kl.TenKL })));
        
        const teacherUsers = (userList || []).filter((u: any) => {
          const name = String(u?.nhom?.TenNhomNguoiDung || '').toLowerCase();
          return !name.includes('hoc sinh') && !name.includes('student');
        });
        setTeachers(teacherUsers.map((u: any) => ({ value: u.MaNguoiDung, label: u.HoVaTen || u.TenDangNhap })));

        // Set default year for management
        if (yearList.length > 0) {
          setManagementYear(yearList[0].MaNH);
        }
      } catch (e: any) {
        setStatus(e?.message || 'Lỗi tải dữ liệu');
      }
    })();
  }, []);

  // Load classes when grade or year changes
  useEffect(() => {
    if (activeTab === 'assign') {
      (async () => {
        try {
          const params: any = {};
          if (selectedYear) params.MaNamHoc = Number(selectedYear);
          if (selectedGrade) params.MaKhoiLop = Number(selectedGrade);
          const cls = await api.listClasses(params);
          setClasses(cls.map((c: any) => ({ value: c.MaLop, label: c.TenLop })));
        } catch (e: any) {
          setStatus(e?.message || 'Lỗi tải lớp');
        }
      })();
    }
  }, [selectedYear, selectedGrade, activeTab]);

  // Load class assignments for management
  useEffect(() => {
    if (activeTab === 'manage' && managementYear) {
      loadClassAssignments();
    }
  }, [managementYear, managementGrade, activeTab]);

  const loadClassAssignments = async () => {
    setLoading(true);
    try {
      const params: any = { MaNamHoc: managementYear };
      if (managementGrade !== 'all') params.MaKhoiLop = Number(managementGrade);
      
      const data = await api.getClassAssignments(params);
      setClassAssignments(data || []);
    } catch (err: any) {
      setStatus(err.message || 'Không thể tải danh sách phán công');
    } finally {
      setLoading(false);
    }
  };

  const selectedClassData = useMemo(() => {
    return classes.find((c) => c.value === selectedClass);
  }, [selectedClass, classes]);

  const selectedYearLabel = useMemo(() => {
    return years.find((y) => y.value === selectedYear)?.label || '';
  }, [selectedYear, years]);

  const selectedGradeLabel = useMemo(() => {
    return grades.find((g) => g.value === selectedGrade)?.label || '';
  }, [selectedGrade, grades]);

  const canAssignHomeroom = useMemo(() => {
    return !!selectedClass && !!selectedHomeroomTeacher;
  }, [selectedClass, selectedHomeroomTeacher]);

  const canAssignSubjectTeacher = useMemo(() => {
    return !!selectedClass && !!selectedSemester && !!selectedSubject && !!selectedSubjectTeacher;
  }, [selectedClass, selectedSemester, selectedSubject, selectedSubjectTeacher]);

  const assignHomeroom = async () => {
    setStatus('');
    try {
      await api.assignHomeroom(selectedClass, selectedHomeroomTeacher);
      setStatus('✅ Đã gán GVCN cho lớp thành công');
      setSelectedHomeroomTeacher('');
    } catch (e: any) {
      setStatus('❌ ' + (e?.response?.data?.message || e?.message || 'Lỗi gán GVCN'));
    }
  };

  const assignSubject = async () => {
    setStatus('');
    try {
      await api.assignSubjectTeacher({
        MaLop: selectedClass,
        MaMon: selectedSubject,
        MaHocKy: selectedSemester,
        MaGV: selectedSubjectTeacher,
      });
      setStatus('✅ Đã gán giáo viên bộ môn thành công');
      setSelectedSubjectTeacher('');
    } catch (e: any) {
      setStatus('❌ ' + (e?.response?.data?.message || e?.message || 'Lỗi gán GV bộ môn'));
    }
  };

  const handleRemoveHomeroomTeacher = async (MaLop: number, TenLop: string) => {
    if (!confirm(`Xác nhận xóa giáo viên chủ nhiệm của lớp ${TenLop}?`)) return;
    
    try {
      await api.removeHomeroomTeacher(MaLop);
      setStatus('✅ Đã xóa giáo viên chủ nhiệm');
      loadClassAssignments();
    } catch (err: any) {
      setStatus('❌ ' + (err.response?.data?.message || err.message || 'Không thể xóa'));
    }
  };

  const handleRemoveSubjectTeacher = async (MaBangDiemMon: number, teacherName: string, subjectName: string) => {
    if (!confirm(`Xác nhận xóa phân công giáo viên ${teacherName} dạy ${subjectName}?`)) return;
    
    try {
      await api.removeSubjectTeacher(MaBangDiemMon);
      setStatus('✅ Đã xóa phân công giáo viên bộ môn');
      loadClassAssignments();
    } catch (err: any) {
      setStatus('❌ ' + (err.response?.data?.message || err.message || 'Không thể xóa'));
    }
  };

  return (
    <div>
      <h1 className="text-indigo-900 mb-6">Quản lý phân công giáo viên</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('assign')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'assign'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Plus className="w-5 h-5" />
          Phân công mới
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'manage'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-5 h-5" />
          Danh sách phân công
        </button>
      </div>

      {status && (
        <div className={`mb-4 p-3 rounded-md ${status.startsWith('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {status}
        </div>
      )}

      {/* Assignment Tab */}
      {activeTab === 'assign' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              Chọn lớp
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Năm học</label>
                <select value={selectedYear as any} onChange={(e) => setSelectedYear(e.target.value)} className="w-full border rounded p-2">
                  <option value="">-- Chọn năm học --</option>
                  {years.map((y) => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Khối</label>
                <select value={selectedGrade as any} onChange={(e) => setSelectedGrade(e.target.value)} className="w-full border rounded p-2">
                  <option value="">-- Chọn khối --</option>
                  {grades.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Lớp</label>
                <select value={selectedClass as any} onChange={(e) => setSelectedClass(e.target.value)} className="w-full border rounded p-2">
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Homeroom teacher assignment */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Giáo viên chủ nhiệm
              </h2>
              
              {selectedClass && selectedClassData && (
                <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Lớp:</span> {selectedClassData.label} • 
                    <span className="font-medium"> Khối:</span> {selectedGradeLabel} • 
                    <span className="font-medium"> Năm:</span> {selectedYearLabel}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Giáo viên</label>
                  <select value={selectedHomeroomTeacher as any} onChange={(e) => setSelectedHomeroomTeacher(e.target.value)} className="w-full border rounded p-2">
                    <option value="">-- Chọn giáo viên --</option>
                    {teachers.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={assignHomeroom} disabled={!canAssignHomeroom} className={`w-full py-2 rounded ${canAssignHomeroom ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-600'}`}>
                  Gán GVCN
                </button>
              </div>
            </div>

            {/* Subject teacher assignment */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Giáo viên bộ môn
              </h2>
              
              {selectedClass && selectedClassData && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Lớp:</span> {selectedClassData.label} • 
                    <span className="font-medium"> Khối:</span> {selectedGradeLabel} • 
                    <span className="font-medium"> Năm:</span> {selectedYearLabel}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Học kỳ</label>
                  <select value={selectedSemester as any} onChange={(e) => setSelectedSemester(e.target.value)} className="w-full border rounded p-2">
                    <option value="">-- Chọn học kỳ --</option>
                    {semesters.map((hk) => (
                      <option key={hk.value} value={hk.value}>{hk.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Môn học</label>
                  <select value={selectedSubject as any} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full border rounded p-2">
                    <option value="">-- Chọn môn --</option>
                    {subjects.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Giáo viên</label>
                  <select value={selectedSubjectTeacher as any} onChange={(e) => setSelectedSubjectTeacher(e.target.value)} className="w-full border rounded p-2">
                    <option value="">-- Chọn giáo viên --</option>
                    {teachers.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={assignSubject} disabled={!canAssignSubjectTeacher} className={`w-full py-2 rounded ${canAssignSubjectTeacher ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600'}`}>
                  Gán GV bộ môn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Management Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <h2 className="text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              Bộ lọc
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Năm học</label>
                <select
                  value={managementYear || ''}
                  onChange={(e) => setManagementYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {years.map((y) => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Khối</label>
                <select
                  value={managementGrade}
                  onChange={(e) => setManagementGrade(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tất cả khối</option>
                  {grades.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading && <div className="text-indigo-600">Đang tải dữ liệu...</div>}

          {/* Class List */}
          <div className="space-y-4">
            {classAssignments.map((cls) => (
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
                      <h4 className="text-gray-900 font-medium flex items-center gap-2 mb-2">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        Giáo viên chủ nhiệm
                      </h4>
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

            {!loading && classAssignments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Không có lớp nào trong năm học và khối đã chọn
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
