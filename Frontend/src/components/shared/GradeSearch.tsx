import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../../api/client';
import { GradeRecord, StudentInClass, ClassInfo } from '../../api/types';

interface TeacherGradePayload {
  MaHocSinh: string;
  HoTen: string;
  DiemMieng?: number | null;
  Diem15Phut?: number | null;
  Diem1Tiet?: number | null;
  DiemGiuaKy?: number;
  DiemCuoiKy?: number;
  DiemTBMon?: number;
}

// Mock data removed. Integrate real data via props or API.

interface GradeSearchProps {
  userRole: 'teacher' | 'student';
  teacherId?: number | null;
}

export function GradeSearch({ userRole, teacherId }: GradeSearchProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1'); // MaHocKy
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Student role: get own grades and classes
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [errorStudent, setErrorStudent] = useState<string | null>(null);

  // Teacher role: get class students and their grades
  const [classStudents, setClassStudents] = useState<TeacherGradePayload[]>([]);
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [errorTeacher, setErrorTeacher] = useState<string | null>(null);

  // Load student's own grades
  useEffect(() => {
    if (userRole === 'student') {
      setLoadingStudent(true);
      setErrorStudent(null);
      Promise.all([
        api.getMyClasses(selectedSemester),
        api.getMyScores(selectedSemester),
      ])
        .then(([classes, grades]) => {
          setStudentClasses(classes);
          setGrades(grades);
        })
        .catch((err) => {
          setErrorStudent(err.message);
        })
        .finally(() => setLoadingStudent(false));
    }
  }, [userRole, selectedSemester]);
  // Teacher: load classes & subjects when role/semester changes
  useEffect(() => {
    if (userRole !== 'teacher') return;
    let mounted = true;
    setLoadingTeacher(true);
    setErrorTeacher(null);

    (async () => {
      try {
        const [clsList, subjList] = await Promise.all([
          api.getTeacherClasses({ MaHocKy: selectedSemester }),
          api.listSubjects(),
        ]);
        if (!mounted) return;
        setClasses(clsList as ClassInfo[]);
        setSubjects((s) => (s.length ? s : subjList));

        // set sensible defaults if none selected
        const defaultClass = String(clsList?.[0]?.MaLop || '');
        const defaultSub = String((subjList?.[0]?.MaMonHoc) || '');
        if (!selectedClassId && defaultClass) setSelectedClassId(defaultClass);
        if (!selectedSubjectId && defaultSub) setSelectedSubjectId(defaultSub);
      } catch (err: any) {
        if (!mounted) return;
        setErrorTeacher(err.message || 'Không thể tải danh sách lớp/môn');
      } finally {
        if (mounted) setLoadingTeacher(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userRole, selectedSemester]);

  // Teacher: load students and their scores when class/subject/semester change
  const loadClassStudents = useCallback(async () => {
    if (userRole !== 'teacher') return;
    if (!selectedClassId) return setClassStudents([]);
    setLoadingTeacher(true);
    setErrorTeacher(null);
    try {
      const students = await api.getStudentsByClass(selectedClassId, selectedSemester);
      const subId = selectedSubjectId || String(subjects?.[0]?.MaMonHoc || '');

      const scored = await Promise.all(
        students.map(async (s: any) => {
          const scores = await api.getStudentScores(s.MaHocSinh, selectedSemester, subId);
          const mon = (scores || []).find((m: any) => String(m.MaMon) === String(subId)) || null;
          return {
            MaHocSinh: s.MaHocSinh,
            HoTen: s.HoTen,
            DiemMieng: mon?.DiemMieng ?? null,
            Diem15Phut: mon?.Diem15Phut ?? null,
            Diem1Tiet: mon?.Diem1Tiet ?? null,
            DiemGiuaKy: mon?.DiemGiuaKy ?? null,
            DiemCuoiKy: mon?.DiemCuoiKy ?? null,
            DiemTBMon: mon?.DiemTBMon ?? null,
          } as TeacherGradePayload;
        })
      );

      setClassStudents(scored);
    } catch (err: any) {
      setErrorTeacher(err.message || 'Không thể tải điểm lớp');
      setClassStudents([]);
    } finally {
      setLoadingTeacher(false);
    }
  }, [userRole, selectedClassId, selectedSubjectId, selectedSemester, subjects]);

  useEffect(() => {
    loadClassStudents();
  }, [loadClassStudents]);

  const overallAverage =
    grades.length > 0 ? grades.reduce((sum, g) => sum + (g.DiemTBMon || 0), 0) / grades.length : 0;
  const excellentCount = grades.filter((g) => (g.DiemTBMon || 0) >= 8).length;
  const goodCount = grades.filter((g) => (g.DiemTBMon || 0) >= 6.5 && (g.DiemTBMon || 0) < 8).length;

  const classOverallAverage =
    classStudents.length > 0
      ? classStudents.reduce((sum, s) => sum + (s.DiemTBMon || 0), 0) / classStudents.length
      : 0;
  const classExcellentCount = classStudents.filter((s) => (s.DiemTBMon || 0) >= 8).length;
  const classPoorCount = classStudents.filter((s) => (s.DiemTBMon || 0) < 5).length;

  const selectedClassName = classes.find((c) => String(c.MaLop) === selectedClassId)?.TenLop || '';
  const selectedSubjectName = subjects.find((s) => String(s.MaMonHoc) === selectedSubjectId)?.TenMonHoc || '';

  return (
    <div>
      <h1 className={userRole === 'teacher' ? 'text-green-900 mb-6' : 'text-blue-900 mb-6'}>
        Tra cứu điểm
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {userRole === 'teacher' && (
            <>
              <div>
                <label className="block text-gray-700 mb-2">Lớp</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                    <option key={c.MaLop} value={c.MaLop}>{c.TenLop}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Môn học</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Chọn môn --</option>
                  {subjects.map((s) => (
                    <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.TenMonHoc}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-gray-700 mb-2">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Học kỳ I</option>
              <option value="2">Học kỳ II</option>
            </select>
          </div>
        </div>
      </div>

      {userRole === 'student' && (
        <>
          {loadingStudent && <div className="text-blue-600 mb-4">Đang tải dữ liệu...</div>}
          {errorStudent && <div className="text-red-600 mb-4">Lỗi: {errorStudent}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <p className="text-blue-700 mb-1">Điểm trung bình</p>
              <p className="text-blue-900">{overallAverage.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-700 mb-1">Môn giỏi</p>
                  <p className="text-green-900">{excellentCount} môn</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-yellow-700 mb-1">Môn khá</p>
                  <p className="text-yellow-900">{goodCount} môn</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-700">Môn học</th>
                    <th className="px-6 py-4 text-left text-gray-700">Miệng/15p</th>
                    <th className="px-6 py-4 text-left text-gray-700">1 tiết</th>
                    <th className="px-6 py-4 text-left text-gray-700">Giữa kỳ</th>
                    <th className="px-6 py-4 text-left text-gray-700">Cuối kỳ</th>
                    <th className="px-6 py-4 text-left text-gray-700">ĐTB Môn</th>
                    <th className="px-6 py-4 text-left text-gray-700">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {grades.length > 0 ? (
                    grades.map((grade) => (
                      <tr key={grade.MaMon} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{grade.TenMon || (grade as any).TenMonHoc}</td>
                        <td className="px-6 py-4 text-gray-600">{grade.DiemMieng || grade.Diem15Phut ? `${grade.DiemMieng ?? '-'} / ${grade.Diem15Phut ?? '-'}` : '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{grade.Diem1Tiet ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{grade.DiemGiuaKy ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{grade.DiemCuoiKy ?? '-'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded ${
                              (grade.DiemTBMon ?? 0) >= 8
                                ? 'bg-green-100 text-green-700'
                                : (grade.DiemTBMon ?? 0) >= 6.5
                                  ? 'bg-blue-100 text-blue-700'
                                  : (grade.DiemTBMon ?? 0) >= 5
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {grade.DiemTBMon?.toFixed(1) ?? '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded ${
                              grade.XepLoai === 'Xuất sắc'
                                ? 'bg-green-100 text-green-700'
                                : grade.XepLoai === 'Giỏi'
                                  ? 'bg-blue-100 text-blue-700'
                                  : grade.XepLoai === 'Khá'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {grade.XepLoai ?? '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Chưa có dữ liệu điểm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {userRole === 'teacher' && (
        <>
          {loadingTeacher && <div className="text-green-600 mb-4">Đang tải dữ liệu...</div>}
          {errorTeacher && <div className="text-red-600 mb-4">Lỗi: {errorTeacher}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <p className="text-blue-700 mb-1">ĐTB lớp - Môn {selectedSubjectName || 'Chưa chọn'}</p>
              <p className="text-blue-900">{classOverallAverage.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-700 mb-1">HS giỏi (ĐTB {'>'}= 8)</p>
                  <p className="text-green-900">{classExcellentCount} HS</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-700 mb-1">HS yếu (ĐTB &lt; 5)</p>
                  <p className="text-red-900">{classPoorCount} HS</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-gray-900">Bảng điểm môn {selectedSubjectName || 'Chưa chọn'} - Lớp {selectedClassName || 'Chưa chọn'}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-700">Mã HS</th>
                    <th className="px-6 py-4 text-left text-gray-700">Họ và tên</th>
                    <th className="px-6 py-4 text-left text-gray-700">Miệng/15p</th>
                    <th className="px-6 py-4 text-left text-gray-700">1 tiết</th>
                    <th className="px-6 py-4 text-left text-gray-700">Giữa kỳ</th>
                    <th className="px-6 py-4 text-left text-gray-700">Cuối kỳ</th>
                    <th className="px-6 py-4 text-left text-gray-700">ĐTB Môn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {classStudents.length > 0 ? (
                    classStudents.map((student) => (
                      <tr key={student.MaHocSinh} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{student.MaHocSinh}</td>
                        <td className="px-6 py-4 text-gray-900">{student.HoTen}</td>
                        <td className="px-6 py-4 text-gray-600">{student.DiemMieng || student.Diem15Phut ? `${student.DiemMieng ?? '-'} / ${student.Diem15Phut ?? '-'}` : '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{student.Diem1Tiet ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{student.DiemGiuaKy ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{student.DiemCuoiKy ?? '-'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded ${
                              (student.DiemTBMon ?? 0) >= 8
                                ? 'bg-green-100 text-green-700'
                                : (student.DiemTBMon ?? 0) >= 6.5
                                  ? 'bg-blue-100 text-blue-700'
                                  : (student.DiemTBMon ?? 0) >= 5
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {student.DiemTBMon?.toFixed(1) ?? '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Chưa có học sinh trong lớp này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}