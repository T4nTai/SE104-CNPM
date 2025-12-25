import { useState, useEffect } from 'react';
import { Save, Upload, Download } from 'lucide-react';
import { api } from '../../api/client';
import { ClassInfo, StudentInClass } from '../../api/types';

interface ScoreDetail {
  MaLHKT?: string; // Loại hình kiểm tra (e.g., "1" for mieng15Phut, "2" for mot1Tiet)
  Lan?: number; // Lần (occurrence number)
  Diem?: number; // Điểm
  giuaKy?: string;
  cuoiKy?: string;
}

interface GradeEntry {
  MaHocSinh: string;
  HoTen: string;
  scores: {
    mieng15Phut: string;
    mot1Tiet: string;
    giuaKy: string;
    cuoiKy: string;
  };
  average: number | null;
}

export function GradeEntry({ teacherId }: { teacherId: number | null }) {
  console.log('[GradeEntry] Component mounted with teacherId:', teacherId);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]); // Store MaMon of teacher's subjects
  const [testTypes, setTestTypes] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSavingStatus] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [thamSo, setThamSo] = useState<any>(null);
  const [allSubjectsGrades, setAllSubjectsGrades] = useState<Map<string, Map<string, any>>>(
    new Map<string, Map<string, any>>()
  );

  // Check if teacher can edit - only if they teach this subject
  const canEditCurrentSubject = (): boolean => {
    if (!selectedSubject) return false;
    const canEdit = teacherSubjects.includes(selectedSubject);
    console.log('canEditCurrentSubject check:', {
      selectedSubject,
      teacherSubjects,
      result: canEdit
    });
    return canEdit;
  };

  // Only show subjects that teacher teaches
  const getVisibleSubjects = (): any[] => {
    const visible = subjects.filter((subject) => {
      const subjectId = String(subject.MaMonHoc);
      return teacherSubjects.includes(subjectId);
    });
    console.log('[getVisibleSubjects]', {
      totalSubjects: subjects.length,
      teacherSubjects,
      subjectIds: subjects.map(s => ({ id: s.MaMonHoc, idType: typeof s.MaMonHoc, name: s.TenMonHoc })),
      visible: visible.map(s => ({ MaMonHoc: s.MaMonHoc, TenMonHoc: s.TenMonHoc }))
    });
    return visible;
  };

  // Fetch classes (with semester), subjects, and test types on mount and when semester changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loadData = async () => {
      try {
        const classData = await api.getTeacherClasses({ MaHocKy: selectedSemester });
        const subjectData = await api.listSubjects();
        const testTypesData = await api.listTestTypes();
        
        console.log('[loadData] Subjects from API:', subjectData);
        
        setClasses(classData);
        setSubjects(subjectData);
        setTestTypes(testTypesData || []);
        
        // Only fetch teacher assignments if teacherId exists
        if (teacherId) {
          try {
            const assignmentData = await api.getTeacherAssignments(teacherId);
            console.log('Teacher assignments data:', assignmentData);
            if (assignmentData && assignmentData.subject && Array.isArray(assignmentData.subject)) {
              const teacherMaMons = Array.from(
                new Set(assignmentData.subject
                  .filter((a: any) => a.MaMon) // Bỏ qua những có MaMon = null
                  .map((a: any) => String(a.MaMon)))
              );
              console.log('Teacher subjects (MaMon):', teacherMaMons);
              console.log('All subject assignments:', assignmentData.subject);
              setTeacherSubjects(teacherMaMons);
            } else {
              console.log('No subject array in assignment data');
              setTeacherSubjects([]);
            }
          } catch (err: any) {
            console.log('Error loading teacher assignments:', err.message);
            setTeacherSubjects([]);
          }
        }
        
        if (classData.length > 0) {
          setSelectedClass(classData[0]);
        } else {
          setSelectedClass(null);
          setGrades([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedSemester, teacherId]);

  // Fetch students for selected class + semester, then populate grades
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass?.MaLop || !selectedSemester) {
        setGrades([]);
        return;
      }
      try {
        setLoading(true);
        const students = await api.getStudentsByClass(String(selectedClass.MaLop), selectedSemester);
        const gradeEntries: GradeEntry[] = students.map((student: StudentInClass) => ({
          MaHocSinh: student.MaHocSinh,
          HoTen: student.HoTen,
          scores: {
            mieng15Phut: '',
            mot1Tiet: '',
            giuaKy: '',
            cuoiKy: ''
          },
          average: null
        }));
        setGrades(gradeEntries);
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách học sinh');
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [selectedClass, selectedSemester]);

  // Load saved grades when subject is selected
  useEffect(() => {
    const loadSavedGrades = async () => {
      if (!selectedClass?.MaLop || !selectedSubject || !selectedSemester) {
        return;
      }
      try {
        const result = await api.getGradebook(
          String(selectedClass.MaLop),
          selectedSubject,
          selectedSemester
        );

        // Update allSubjectsGrades to include this subject's data
        setAllSubjectsGrades(prev => {
          const updated = new Map<string, Map<string, any>>(prev);
          if (result && result.grades && result.grades.length > 0) {
            const subjectGradeMap = new Map<string, any>(result.grades.map((g: GradeEntry) => [
              g.MaHocSinh,
              { average: g.average, scores: g.scores }
            ]));
            updated.set(selectedSubject, subjectGradeMap);
          } else {
            updated.delete(selectedSubject);
          }
          return updated;
        });

        if (result && result.grades && result.grades.length > 0) {
          // Merge saved grades with current grades (by MaHocSinh)
          const savedMap = new Map<string, GradeEntry>(result.grades.map((g: GradeEntry) => [g.MaHocSinh, g]));
          
          setGrades(prevGrades =>
            prevGrades.map(g => {
              const saved = savedMap.get(g.MaHocSinh);
              if (saved) {
                return {
                  ...g,
                  scores: saved.scores,
                  average: saved.average
                };
              }
              return {
                ...g,
                scores: {
                  mieng15Phut: '',
                  mot1Tiet: '',
                  giuaKy: '',
                  cuoiKy: ''
                },
                average: null
              };
            })
          );
        } else {
          // Nếu không có điểm lưu, reset tất cả scores
          setGrades(prevGrades =>
            prevGrades.map(g => ({
              ...g,
              scores: {
                mieng15Phut: '',
                mot1Tiet: '',
                giuaKy: '',
                cuoiKy: ''
              },
              average: null
            }))
          );
        }
      } catch (err: any) {
        // Silently fail - it's okay if there are no saved grades
        console.log('No saved grades found or error loading them');
        // Reset scores khi có lỗi
        setGrades(prevGrades =>
          prevGrades.map(g => ({
            ...g,
            scores: {
              mieng15Phut: '',
              mot1Tiet: '',
              giuaKy: '',
              cuoiKy: ''
            },
            average: null
          }))
        );
      }
    };
    loadSavedGrades();
  }, [selectedClass, selectedSubject, selectedSemester]);

  // Load ThamSo (configuration with weights) when class is selected
  useEffect(() => {
    const loadThamSo = async () => {
      if (!selectedClass?.MaNamHoc) {
        setThamSo(null);
        return;
      }
      try {
        const result = await api.getThamSo(String(selectedClass.MaNamHoc));
        setThamSo(result);
      } catch (err: any) {
        console.log('No ThamSo found for year:', selectedClass.MaNamHoc);
        setThamSo(null);
      }
    };
    loadThamSo();
  }, [selectedClass]);

  const parseScores = (scoreString: string): number[] => {
    if (!scoreString.trim()) return [];
    return scoreString.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  };

  const calculateAverage = (entry: GradeEntry): number | null => {
    const giuaKy = parseFloat(entry.scores.giuaKy);
    const cuoiKy = parseFloat(entry.scores.cuoiKy);
    
    if (isNaN(giuaKy) || isNaN(cuoiKy)) return null;
    
    const mieng15Scores = parseScores(entry.scores.mieng15Phut);
    const tiet1Scores = parseScores(entry.scores.mot1Tiet);
    
    const mieng15Avg = mieng15Scores.length > 0 
      ? mieng15Scores.reduce((a, b) => a + b, 0) / mieng15Scores.length 
      : 0;
    const tiet1Avg = tiet1Scores.length > 0 
      ? tiet1Scores.reduce((a, b) => a + b, 0) / tiet1Scores.length 
      : 0;
    
    const average = (cuoiKy * 3 + giuaKy * 3 + tiet1Avg * 2 + mieng15Avg) / 9;
    return Math.round(average * 10) / 10;
  };

  // Calculate individual student's overall GPA across all subjects
  const calculateStudentOverallGPA = (studentId: string): number | null => {
    if (allSubjectsGrades.size === 0) return null;

    let totalScore = 0;
    let totalWeight = 0;

    // Iterate through all subjects
    for (const [subjectId, studentGradesMap] of allSubjectsGrades) {
      const subject = subjects.find(s => String(s.MaMonHoc) === subjectId);
      const hesoMon = subject?.HeSoMon || 1;
      const gradeData = studentGradesMap.get(studentId);

      if (gradeData && gradeData.average && !isNaN(gradeData.average)) {
        totalScore += gradeData.average * hesoMon;
        totalWeight += hesoMon;
      }
    }

    if (totalWeight === 0) return null;
    return Math.round((totalScore / totalWeight) * 10) / 10;
  };

  // Calculate overall GPA (tổng điểm tổng kết) from all subjects with weights
  const calculateOverallGPA = (): { gpa: number | null; details: string } => {
    if (!selectedClass?.MaLop || !selectedSemester || allSubjectsGrades.size === 0) {
      return { gpa: null, details: '' };
    }

    // Map to store student overall scores
    const studentOverallScores: Map<string, { totalScore: number; totalWeight: number }> = new Map();

    // Iterate through all subjects
    for (const [subjectId, studentGradesMap] of allSubjectsGrades) {
      const subject = subjects.find(s => String(s.MaMonHoc) === subjectId);
      const hesoMon = subject?.HeSoMon || 1; // Default hệ số = 1 if not found

      // For each student in this subject
      for (const [studentId, gradeData] of studentGradesMap) {
        if (!gradeData.average || isNaN(gradeData.average)) continue;

        if (!studentOverallScores.has(studentId)) {
          studentOverallScores.set(studentId, { totalScore: 0, totalWeight: 0 });
        }

        const current = studentOverallScores.get(studentId)!;
        current.totalScore += gradeData.average * hesoMon;
        current.totalWeight += hesoMon;
      }
    }

    // Calculate overall GPA for each student
    let classGPA = 0;
    let validStudents = 0;

    for (const [, scoreData] of studentOverallScores) {
      if (scoreData.totalWeight > 0) {
        const gpa = scoreData.totalScore / scoreData.totalWeight;
        classGPA += gpa;
        validStudents += 1;
      }
    }

    const finalGPA = validStudents > 0 ? Math.round((classGPA / validStudents) * 10) / 10 : null;
    const details = validStudents > 0 ? `${validStudents}/${grades.length} học sinh` : '';
    
    return { gpa: finalGPA, details };
  };

  const resolveTestTypeIds = () => {
    const norm = (s: string) => s.toLowerCase().replace(/\s|_/g, "");
    const map: Record<string, number | undefined> = {};
    const list = Array.isArray(testTypes) ? testTypes : [];

    // Pass 1: keyword matching
    for (const t of list) {
      const n = norm(t.TenLHKT || "");
      if (!map.mieng && (n.includes("mieng") || n.includes("15"))) map.mieng = t.MaLHKT;
      if (!map.tiet && (n.includes("tiet") || n.includes("1tiet"))) map.tiet = t.MaLHKT;
      if (!map.giuaky && (n.includes("giuaky") || n.includes("gk"))) map.giuaky = t.MaLHKT;
      if (!map.cuoiky && (n.includes("cuoiky") || n.includes("ck"))) map.cuoiky = t.MaLHKT;
    }

    // Pass 2: fallback assign by position if still missing and there are enough items
    if (list.length >= 4) {
      const sorted = [...list].sort((a, b) => Number(a.MaLHKT) - Number(b.MaLHKT));
      if (!map.mieng) map.mieng = sorted[0]?.MaLHKT;
      if (!map.tiet) map.tiet = sorted[1]?.MaLHKT;
      if (!map.giuaky) map.giuaky = sorted[2]?.MaLHKT;
      if (!map.cuoiky) map.cuoiky = sorted[3]?.MaLHKT;
    }

    // Pass 3: if still missing, throw with helpful message
    const missing: string[] = [];
    if (!map.mieng) missing.push("miệng/15p");
    if (!map.tiet) missing.push("1 tiết");
    if (!map.giuaky) missing.push("giữa kỳ");
    if (!map.cuoiky) missing.push("cuối kỳ");

    if (missing.length) {
      const available = list.map((t) => `${t.MaLHKT}:${t.TenLHKT}`).join(", ") || "(không có)";
      throw new Error(`Thiếu cấu hình loại hình kiểm tra: ${missing.join(", ")}. Hiện có: ${available}`);
    }

    return map;
  };

  const handleScoreChange = (studentId: string, field: keyof GradeEntry['scores'], value: string) => {
    setGrades(grades.map(g => {
      if (g.MaHocSinh === studentId) {
        const updated = { 
          ...g, 
          scores: { ...g.scores, [field]: value }
        };
        updated.average = calculateAverage(updated);
        return updated;
      }
      return g;
    }));
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedSemester) {
      alert('Vui lòng chọn lớp, môn học và học kỳ');
      return;
    }

    // Verify teacher has permission to edit this subject
    if (!canEditCurrentSubject()) {
      alert('Bạn không được phân công dạy môn này');
      return;
    }

    // Kiểm tra tất cả học sinh đã có đủ điểm chưa
    const missingGrades = grades.filter(g => 
      !g.scores.giuaKy.trim() || !g.scores.cuoiKy.trim()
    );
    
    if (missingGrades.length > 0) {
      const confirm = window.confirm(
        `Còn ${missingGrades.length} học sinh chưa có đủ điểm giữa kỳ và cuối kỳ. Bạn có muốn tiếp tục lưu?`
      );
      if (!confirm) return;
    }
    
    try {
      setSavingStatus(true);
      setError(null);

      const lhktMap = resolveTestTypeIds();
      if (!lhktMap.mieng || !lhktMap.tiet || !lhktMap.giuaky || !lhktMap.cuoiky) {
        throw new Error('Thiếu cấu hình loại hình kiểm tra (mieng/15p, 1 tiết, giữa kỳ, cuối kỳ). Vui lòng kiểm tra LOAIHINHKIEMTRA.');
      }

      // Construct scores array with test type details
      const scoresArray = grades
        .filter(g => g.scores.giuaKy.trim() || g.scores.cuoiKy.trim())
        .map(g => ({
          MaHocSinh: g.MaHocSinh,
          details: [
            ...(g.scores.mieng15Phut.trim() 
              ? parseScores(g.scores.mieng15Phut).map((score, idx) => ({
                  MaLHKT: String(lhktMap.mieng!),
                  Lan: idx + 1,
                  Diem: score
                }))
              : []
            ),
            ...(g.scores.mot1Tiet.trim()
              ? parseScores(g.scores.mot1Tiet).map((score, idx) => ({
                  MaLHKT: String(lhktMap.tiet!),
                  Lan: idx + 1,
                  Diem: score
                }))
              : []
            ),
            ...(g.scores.giuaKy.trim()
              ? [{ MaLHKT: String(lhktMap.giuaky!), Lan: 1, Diem: parseFloat(g.scores.giuaKy) }]
              : []
            ),
            ...(g.scores.cuoiKy.trim()
              ? [{ MaLHKT: String(lhktMap.cuoiky!), Lan: 1, Diem: parseFloat(g.scores.cuoiKy) }]
              : []
            )
          ]
        }));

      await api.enterGradebook({
        MaLop: selectedClass.MaLop,
        MaHocKy: selectedSemester, // Already numeric: '1' or '2'
        MaMon: selectedSubject, // This is now MaMonHoc (numeric)
        scores: scoresArray
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu bảng điểm');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleImportGrades = async () => {
    if (!canEditCurrentSubject()) {
      setError('Bạn không được phân công dạy môn này');
      return;
    }
    
    if (!importFile) {
      setError('Vui lòng chọn file');
      return;
    }
    if (!selectedClass || !selectedSubject || !selectedSemester) {
      setError('Vui lòng chọn lớp, môn học và học kỳ');
      return;
    }

    setImporting(true);
    setError(null);
    try {
      const result = await api.importGrades(
        String(selectedClass.MaLop),
        selectedSubject,
        selectedSemester,
        importFile
      );

      // Parse import result and update grades (auto-calc averages)
      if (result && result.grades) {
        const withAverages = (result.grades as GradeEntry[]).map((g) => ({
          ...g,
          average: calculateAverage(g),
        }));
        setGrades(withAverages);
        setImportFile(null);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi nhập file');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = [
      ['STT', 'Mã HS', 'Họ và tên', 'Điểm Miệng/15\'', 'Điểm 1 Tiết', 'Điểm Giữa kỳ', 'Điểm Cuối kỳ'].join(','),
      ['1', 'HS0001', 'Hoàng Gia An', '8, 7.5, 9', '8, 7', '7.5', '8'],
      ['2', 'HS0002', 'Nguyễn Minh Khang', '7, 8', '7.5, 8', '8', '8.5'],
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grades_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-green-900 mb-6">Nhập bảng điểm môn học</h1>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Đã lưu bảng điểm thành công!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          Lỗi: {error}
        </div>
      )}

      {loading && <div className="text-green-600 mb-4">Đang tải dữ liệu...</div>}

      {teacherSubjects.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <p className="text-yellow-800"><strong>⚠️ Chú ý:</strong> Bạn chưa được phân công dạy môn nào. Vui lòng liên hệ quản trị viên.</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Lớp</label>
            <select
              value={selectedClass?.MaLop || ''}
              onChange={(e) => {
                const selected = classes.find(c => String(c.MaLop) === e.target.value);
                setSelectedClass(selected || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((cls) => (
                <option key={cls.MaLop} value={cls.MaLop}>
                  {cls.TenLop}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Môn học</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Chọn môn học --</option>
              {getVisibleSubjects().map((subject) => (
                <option key={subject.MaMonHoc} value={subject.MaMonHoc}>
                  {subject.TenMonHoc}
                </option>
              ))}
            </select>
            {getVisibleSubjects().length === 0 && (
              <p className="text-sm text-orange-600 mt-1">⚠️ Bạn không được phân công dạy môn nào</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="1">Học kỳ I</option>
              <option value="2">Học kỳ II</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200">
        <h3 className="text-gray-900 font-medium mb-3 flex items-center gap-2">
          <Upload className="w-5 h-5 text-green-600" />
          Nhập điểm từ file Excel/CSV
        </h3>
        {selectedSubject && !canEditCurrentSubject() && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg mb-3">
            <p className="text-orange-700 text-sm">⚠️ Bạn không được phân công dạy môn này</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <input
            type="file"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="text-sm flex-1"
            disabled={!canEditCurrentSubject()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleImportGrades}
              disabled={importing || !importFile || !canEditCurrentSubject()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title={!canEditCurrentSubject() ? 'Bạn không được phân công dạy môn này' : ''}
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Đang nhập...' : 'Nhập file'}
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Tải mẫu CSV
            </button>
            {grades.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setGrades(prev =>
                    prev.map(g => ({
                      ...g,
                      scores: {
                        mieng15Phut: '',
                        mot1Tiet: '',
                        giuaKy: '',
                        cuoiKy: ''
                      },
                      average: null,
                    }))
                  )
                }
                className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 whitespace-nowrap"
              >
                Xóa số điểm
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <p className="text-blue-900 mb-2">
          <strong>Hướng dẫn nhập điểm:</strong>
        </p>
        <ul className="text-blue-800 text-sm space-y-1 ml-4 list-disc">
          <li>Điểm Miệng/15 phút và 1 Tiết: Nhập nhiều điểm cách nhau bởi dấu phẩy (VD: 8, 7.5, 9)</li>
          <li>Điểm Giữa kỳ và Cuối kỳ: Nhập một điểm duy nhất (VD: 8.5)</li>
          <li>Công thức tính ĐTB Môn: (Cuối kỳ × 3 + Giữa kỳ × 3 + ĐTB 1 Tiết × 2 + ĐTB Miệng/15' × 1) / 9</li>
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 border-r">STT</th>
                <th className="px-4 py-3 text-left text-gray-700 border-r">Mã HS</th>
                <th className="px-4 py-3 text-left text-gray-700 border-r">Họ và tên</th>
                <th className="px-4 py-3 text-center text-gray-700 border-r bg-blue-50">
                  <div>Điểm Miệng/15'</div>
                  <div className="text-xs text-gray-500">(VD: 8, 7.5, 9)</div>
                </th>
                <th className="px-4 py-3 text-center text-gray-700 border-r bg-purple-50">
                  <div>Điểm 1 Tiết</div>
                  <div className="text-xs text-gray-500">(VD: 8, 7)</div>
                </th>
                <th className="px-4 py-3 text-center text-gray-700 border-r bg-yellow-50">
                  <div>Điểm Giữa kỳ</div>
                  <div className="text-xs text-gray-500">(VD: 7.5)</div>
                </th>
                <th className="px-4 py-3 text-center text-gray-700 border-r bg-orange-50">
                  <div>Điểm Cuối kỳ</div>
                  <div className="text-xs text-gray-500">(VD: 8)</div>
                </th>
                <th className="px-4 py-3 text-center text-gray-700 border-r bg-green-50">ĐTB Môn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grades.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Chọn lớp để xem danh sách học sinh
                  </td>
                </tr>
              ) : (
                grades.map((entry, index) => (
                  <tr key={entry.MaHocSinh} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 border-r">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900 border-r">{entry.MaHocSinh}</td>
                    <td className="px-4 py-3 text-gray-900 border-r">{entry.HoTen}</td>
                    
                    {/* Điểm Miệng/15' */}
                    <td className="px-4 py-3 border-r bg-blue-50">
                      <input
                        type="text"
                        value={entry.scores.mieng15Phut}
                        onChange={(e) => handleScoreChange(entry.MaHocSinh, 'mieng15Phut', e.target.value)}
                        disabled={!canEditCurrentSubject()}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !canEditCurrentSubject() ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                        }`}
                        placeholder="8, 7.5, 9"
                      />
                    </td>

                    {/* Điểm 1 Tiết */}
                    <td className="px-4 py-3 border-r bg-purple-50">
                      <input
                        type="text"
                        value={entry.scores.mot1Tiet}
                        onChange={(e) => handleScoreChange(entry.MaHocSinh, 'mot1Tiet', e.target.value)}
                        disabled={!canEditCurrentSubject()}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          !canEditCurrentSubject() ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                        }`}
                        placeholder="8, 7"
                      />
                    </td>

                    {/* Điểm Giữa kỳ */}
                    <td className="px-4 py-3 border-r bg-yellow-50">
                      <input
                        type="text"
                        value={entry.scores.giuaKy}
                        onChange={(e) => handleScoreChange(entry.MaHocSinh, 'giuaKy', e.target.value)}
                        disabled={!canEditCurrentSubject()}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                          !canEditCurrentSubject() ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                        }`}
                        placeholder="7.5"
                      />
                    </td>

                    {/* Điểm Cuối kỳ */}
                    <td className="px-4 py-3 border-r bg-orange-50">
                      <input
                        type="text"
                        value={entry.scores.cuoiKy}
                        onChange={(e) => handleScoreChange(entry.MaHocSinh, 'cuoiKy', e.target.value)}
                        disabled={!canEditCurrentSubject()}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          !canEditCurrentSubject() ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                        }`}
                        placeholder="8"
                      />
                    </td>

                    {/* ĐTB Môn */}
                    <td className="px-4 py-3 text-center border-r bg-green-50">
                      <span className={`px-3 py-2 rounded inline-block min-w-[50px] ${
                        entry.average !== null && entry.average >= 8 ? 'bg-green-100 text-green-700' :
                        entry.average !== null && entry.average >= 6.5 ? 'bg-blue-100 text-blue-700' :
                        entry.average !== null && entry.average >= 5 ? 'bg-yellow-100 text-yellow-700' :
                        entry.average !== null ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {entry.average !== null ? entry.average.toFixed(1) : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phần thể hiện điểm tổng kết */}
      {grades.length > 0 && (() => {
        const gpaResult = calculateOverallGPA();
        return (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-200 mb-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">📊 Tính điểm tổng kết</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Hệ số Miệng/15 phút</p>
                <p className="text-2xl font-bold text-indigo-600">{(Number(thamSo?.HesoMieng) || 1).toFixed(1)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Hệ số 1 Tiết & Giữa kỳ</p>
                <p className="text-2xl font-bold text-purple-600">{(Number(thamSo?.HesoChinh15p) || 1).toFixed(1)} / {(Number(thamSo?.HesoGiuaky) || 3).toFixed(1)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Hệ số Cuối kỳ</p>
                <p className="text-2xl font-bold text-pink-600">{(Number(thamSo?.HesoCuoiky) || 3).toFixed(1)}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border-2 border-indigo-300">
              <p className="text-gray-700 font-medium mb-2">Công thức tính ĐTB môn:</p>
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  (Cuối kỳ × 3 + Giữa kỳ × 3 + ĐTB 1 Tiết × 2 + ĐTB Miệng/15' × 1) / 9
                </span>
              </p>
              <p className="text-gray-700 font-medium mb-2">Công thức tính điểm tổng kết:</p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  (Toán × HeSoToán + Văn × HeSoVăn + ...) / Tổng Hệ Số
                </span>
              </p>
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Hệ số các môn:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {subjects.map(subject => (
                    <div key={subject.MaMonHoc} className="text-sm">
                      <span className="font-medium text-blue-700">{subject.TenMonHoc}:</span>
                      <span className="text-blue-600 ml-1">{(Number(subject.HeSoMon) || 1).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 font-medium mb-2">Điểm tổng kết lớp:</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Điểm TB tất cả môn</p>
                  <p className={`text-3xl font-bold ${
                    gpaResult.gpa !== null && gpaResult.gpa >= 5 ? 'text-green-600' :
                    gpaResult.gpa !== null ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {gpaResult.gpa !== null ? gpaResult.gpa.toFixed(2) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Trạng thái</p>
                  <p className={`text-lg font-bold px-3 py-1 rounded ${
                    gpaResult.gpa !== null && gpaResult.gpa >= 5 
                      ? 'bg-green-100 text-green-700' 
                      : gpaResult.gpa !== null
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {gpaResult.gpa !== null && gpaResult.gpa >= 5 ? '✓ ĐẠT' : gpaResult.gpa !== null ? '✗ KHÔNG ĐẠT' : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Thống kê</p>
                  <p className="text-lg font-semibold text-indigo-600">
                    {gpaResult.details}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !canEditCurrentSubject()}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
            canEditCurrentSubject()
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!canEditCurrentSubject() ? 'Bạn không được phân công dạy môn này' : ''}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Đang lưu...' : 'Lưu bảng điểm'}
        </button>
      </div>
    </div>
  );
}