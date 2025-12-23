import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';

interface Option<T = any> {
  value: string | number;
  label: string;
  raw?: T;
}

export function TeacherAssignment() {
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
        setYears(yearList.map((y: any) => ({ value: y.MaNH, label: `${y.Nam1}-${y.Nam2}` })));
        setSemesters(semesterList.map((hk: any) => ({ value: hk.MaHK, label: hk.TenHK })));
        setSubjects(subjectList.map((m: any) => ({ value: m.MaMonHoc, label: m.TenMonHoc })));
        setGrades(gradeList.map((kl: any) => ({ value: kl.MaKL, label: kl.TenKL })));
        const teacherUsers = (userList || []).filter((u: any) => {
          const name = String(u?.nhom?.TenNhomNguoiDung || '').toLowerCase();
          return !name.includes('hoc sinh') && !name.includes('student');
        });
        setTeachers(teacherUsers.map((u: any) => ({ value: u.MaNguoiDung, label: u.HoVaTen || u.TenDangNhap })));
      } catch (e: any) {
        setStatus(e?.message || 'Lỗi tải dữ liệu');
      }
    })();
  }, []);

  // Load classes when grade or year changes
  useEffect(() => {
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
  }, [selectedYear, selectedGrade]);

  const selectedClassData = useMemo(() => {
    return classes.find((c) => c.value === selectedClass);
  }, [selectedClass, classes]);

  const selectedYearLabel = useMemo(() => {
    return years.find((y) => y.value === selectedYear)?.label || '';
  }, [selectedYear, years]);

  const selectedGradeLabel = useMemo(() => {
    return grades.find((g) => g.value === selectedGrade)?.label || '';
  }, [selectedGrade, grades]);

  const selectedSemesterLabel = useMemo(() => {
    return semesters.find((s) => s.value === selectedSemester)?.label || '';
  }, [selectedSemester, semesters]);

  const canAssignHomeroom = useMemo(() => {
    return !!selectedClass && !!selectedHomeroomTeacher;
  }, [selectedClass, selectedHomeroomTeacher]);

  const canAssignSubjectTeacher = useMemo(() => {
    return !!selectedClass && !!selectedSemester && !!selectedSubject && !!selectedSubjectTeacher;
  }, [selectedClass, selectedSemester, selectedSubject, selectedSubjectTeacher]);

  const assignHomeroom = async () => {
    setStatus('');
    try {
      const res = await api.assignHomeroom(selectedClass, selectedHomeroomTeacher);
      if (res) setStatus('Đã gán GVCN cho lớp thành công');
    } catch (e: any) {
      setStatus(e?.message || 'Lỗi gán GVCN');
    }
  };

  const assignSubject = async () => {
    setStatus('');
    try {
      const res = await api.assignSubjectTeacher({
        MaLop: selectedClass,
        MaMon: selectedSubject,
        MaHocKy: selectedSemester,
        MaGV: selectedSubjectTeacher,
      });
      if (res) setStatus('Đã gán GV bộ môn cho bảng điểm môn');
    } catch (e: any) {
      setStatus(e?.message || 'Lỗi gán GV bộ môn');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-indigo-900">Phân công giáo viên</h1>
      {status && <div className="p-3 rounded bg-yellow-100 text-yellow-800">{status}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Homeroom assignment */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-gray-900 mb-4">Giáo viên chủ nhiệm (GVCN)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm text-gray-700 mb-1">Khối lớp</label>
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
            <div>
              <label className="block text-sm text-gray-700 mb-1">Giáo viên</label>
              <select value={selectedHomeroomTeacher as any} onChange={(e) => setSelectedHomeroomTeacher(e.target.value)} className="w-full border rounded p-2">
                <option value="">-- Chọn giáo viên --</option>
                {teachers.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={assignHomeroom} disabled={!canAssignHomeroom} className={`px-4 py-2 rounded ${canAssignHomeroom ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              Gán GVCN cho lớp
            </button>
          </div>
        </div>

        {/* Subject teacher assignment */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-gray-900 mb-4">Giáo viên bộ môn</h2>
          
          {/* Display selected class info */}
          {selectedClass && selectedClassData && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Lớp:</span> {selectedClassData.label} • <span className="font-medium">Khối:</span> {selectedGradeLabel} • <span className="font-medium">Năm học:</span> {selectedYearLabel}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Lớp</label>
              <select value={selectedClass as any} onChange={(e) => setSelectedClass(e.target.value)} className="w-full border rounded p-2">
                <option value="">-- Chọn lớp --</option>
                {classes.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
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
          </div>
          <div className="mt-4">
            <button onClick={assignSubject} disabled={!canAssignSubjectTeacher} className={`px-4 py-2 rounded ${canAssignSubjectTeacher ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              Gán GV bộ môn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
