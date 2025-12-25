import { useState, useEffect } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { api } from '../../api/client';
import { ClassInfo, StudentInClass } from '../../api/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface StudentGrade {
  MaHocSinh: string;
  HoTen: string;
  grades: Map<string, number | null>; // MaMon -> average
  overallGPA: number | null;
}

export function HomeroomGradeView({ teacherId }: { teacherId: number | null }) {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHomeroom, setIsHomeroom] = useState(false);

  // Fetch homeroom classes
  useEffect(() => {
    const loadClasses = async () => {
      if (!teacherId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get all classes where teacher is homeroom teacher
        const allClasses = await api.getTeacherClasses({ MaHocKy: selectedSemester });
        const homeroomClasses = allClasses.filter(
          (c: ClassInfo) => c.roles && c.roles.includes('homeroom')
        );
        
        setClasses(homeroomClasses);
        if (homeroomClasses.length > 0) {
          setSelectedClass(homeroomClasses[0]);
          setIsHomeroom(true);
        } else {
          setIsHomeroom(false);
          setError('Bạn không phải là giáo viên chủ nhiệm của lớp nào');
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách lớp');
      } finally {
        setLoading(false);
      }
    };
    
    loadClasses();
  }, [teacherId, selectedSemester]);

  // Fetch subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectData = await api.listSubjects();
        setSubjects(subjectData);
      } catch (err: any) {
        console.error('Error loading subjects:', err);
      }
    };
    
    loadSubjects();
  }, []);

  // Fetch all grades for selected class
  useEffect(() => {
    const loadAllGrades = async () => {
      if (!selectedClass?.MaLop || !selectedSemester || subjects.length === 0) {
        setStudentGrades([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get students in class
        const students = await api.getStudentsByClass(String(selectedClass.MaLop), selectedSemester);
        
        // Get grades for all subjects
        const allSubjectGrades = new Map<string, Map<string, number>>();
        
        for (const subject of subjects) {
          try {
            const result = await api.getGradebook(
              String(selectedClass.MaLop),
              String(subject.MaMonHoc),
              selectedSemester
            );
            
            if (result && result.grades && result.grades.length > 0) {
              const subjectMap = new Map<string, number>();
              result.grades.forEach((g: any) => {
                if (g.average !== null && !isNaN(g.average)) {
                  subjectMap.set(g.MaHocSinh, g.average);
                }
              });
              allSubjectGrades.set(String(subject.MaMonHoc), subjectMap);
            }
          } catch (err) {
            // Silently skip subjects with no grades
            console.log(`No grades for subject ${subject.MaMonHoc}`);
          }
        }

        // Build student grade data
        const studentData: StudentGrade[] = students.map((student: StudentInClass) => {
          const grades = new Map<string, number | null>();
          let totalScore = 0;
          let totalWeight = 0;

          subjects.forEach((subject) => {
            const subjectGrades = allSubjectGrades.get(String(subject.MaMonHoc));
            const grade = subjectGrades?.get(student.MaHocSinh) || null;
            grades.set(String(subject.MaMonHoc), grade);

            if (grade !== null && !isNaN(grade)) {
              const heSo = subject.HeSoMon || 1;
              totalScore += grade * heSo;
              totalWeight += heSo;
            }
          });

          const overallGPA = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : null;

          return {
            MaHocSinh: student.MaHocSinh,
            HoTen: student.HoTen,
            grades,
            overallGPA
          };
        });

        setStudentGrades(studentData);
      } catch (err: any) {
        setError(err.message || 'Không thể tải điểm học sinh');
      } finally {
        setLoading(false);
      }
    };

    loadAllGrades();
  }, [selectedClass, selectedSemester, subjects]);

  const handleExportCSV = () => {
    if (studentGrades.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    // Build CSV header
    const headers = ['STT', 'Mã học sinh', 'Họ và tên'];
    subjects.forEach(subject => headers.push(subject.TenMonHoc));
    headers.push('ĐTB Tổng kết');

    // Build CSV rows
    const rows = studentGrades.map((student, index) => {
      const row = [
        String(index + 1),
        student.MaHocSinh,
        student.HoTen
      ];
      
      subjects.forEach(subject => {
        const grade = student.grades.get(String(subject.MaMonHoc));
        row.push(grade !== null && grade !== undefined ? grade.toFixed(1) : '-');
      });
      
      row.push(student.overallGPA !== null ? student.overallGPA.toFixed(2) : '-');
      
      return row;
    });

    // Combine to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bang-diem-${selectedClass?.TenLop || 'lop'}-HK${selectedSemester}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (studentGrades.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(16);
    doc.text(`BẢNG ĐIỂM LỚP ${selectedClass?.TenLop || ''} - HỌC KỲ ${selectedSemester}`, 14, 15);
    
    // Prepare table data
    const headers = [['STT', 'Mã HS', 'Họ và tên', ...subjects.map(s => s.TenMonHoc), 'ĐTB TK']];
    
    const rows = studentGrades.map((student, index) => {
      const row = [
        String(index + 1),
        student.MaHocSinh,
        student.HoTen
      ];
      
      subjects.forEach(subject => {
        const grade = student.grades.get(String(subject.MaMonHoc));
        row.push(grade !== null && grade !== undefined ? grade.toFixed(1) : '-');
      });
      
      row.push(student.overallGPA !== null ? student.overallGPA.toFixed(2) : '-');
      
      return row;
    });

    // Add table
    (doc as any).autoTable({
      head: headers,
      body: rows,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 }
      }
    });

    doc.save(`bang-diem-${selectedClass?.TenLop || 'lop'}-HK${selectedSemester}.pdf`);
  };

  if (!isHomeroom && !loading) {
    return (
      <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl">
        <h2 className="text-orange-900 text-xl font-semibold mb-2">Không có quyền truy cập</h2>
        <p className="text-orange-700">Bạn không phải là giáo viên chủ nhiệm của lớp nào.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-green-900 mb-6">Xem bảng điểm lớp chủ nhiệm</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          Lỗi: {error}
        </div>
      )}

      {loading && <div className="text-green-600 mb-4">Đang tải dữ liệu...</div>}

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">Lớp chủ nhiệm</label>
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
        <h3 className="text-gray-900 font-medium mb-3">Xuất file</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={studentGrades.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Xuất CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={studentGrades.length === 0}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Xuất PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 border-r sticky left-0 bg-gray-50 z-10">STT</th>
                <th className="px-4 py-3 text-left text-gray-700 border-r sticky left-12 bg-gray-50 z-10">Mã HS</th>
                <th className="px-4 py-3 text-left text-gray-700 border-r sticky left-32 bg-gray-50 z-10">Họ và tên</th>
                {subjects.map((subject) => (
                  <th key={subject.MaMonHoc} className="px-4 py-3 text-center text-gray-700 border-r bg-blue-50 min-w-[100px]">
                    <div>{subject.TenMonHoc}</div>
                    <div className="text-xs text-gray-500">(HS: {subject.HeSoMon || 1})</div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-gray-700 bg-indigo-50 min-w-[120px]">
                  <div>ĐTB Tổng kết</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {studentGrades.length === 0 && !loading ? (
                <tr>
                  <td colSpan={subjects.length + 4} className="px-4 py-8 text-center text-gray-500">
                    Chọn lớp để xem bảng điểm
                  </td>
                </tr>
              ) : (
                studentGrades.map((student, index) => (
                  <tr key={student.MaHocSinh} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 border-r sticky left-0 bg-white">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900 border-r sticky left-12 bg-white">{student.MaHocSinh}</td>
                    <td className="px-4 py-3 text-gray-900 border-r sticky left-32 bg-white">{student.HoTen}</td>
                    
                    {subjects.map((subject) => {
                      const grade = student.grades.get(String(subject.MaMonHoc));
                      return (
                        <td key={subject.MaMonHoc} className="px-4 py-3 text-center border-r bg-blue-50">
                          <span className={`px-3 py-1 rounded inline-block min-w-[50px] ${
                            grade !== null && grade !== undefined && grade >= 8 ? 'bg-green-100 text-green-700' :
                            grade !== null && grade !== undefined && grade >= 6.5 ? 'bg-blue-100 text-blue-700' :
                            grade !== null && grade !== undefined && grade >= 5 ? 'bg-yellow-100 text-yellow-700' :
                            grade !== null && grade !== undefined ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {grade !== null && grade !== undefined ? grade.toFixed(1) : '-'}
                          </span>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3 text-center bg-indigo-50">
                      <span className={`px-3 py-2 rounded inline-block min-w-[60px] font-medium ${
                        student.overallGPA !== null && student.overallGPA >= 8 ? 'bg-green-100 text-green-700' :
                        student.overallGPA !== null && student.overallGPA >= 6.5 ? 'bg-blue-100 text-blue-700' :
                        student.overallGPA !== null && student.overallGPA >= 5 ? 'bg-yellow-100 text-yellow-700' :
                        student.overallGPA !== null ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {student.overallGPA !== null ? student.overallGPA.toFixed(2) : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {studentGrades.length > 0 && (() => {
        const classAverage = studentGrades.reduce((sum, s) => sum + (s.overallGPA || 0), 0) / studentGrades.length;
        const passCount = studentGrades.filter(s => s.overallGPA !== null && s.overallGPA >= 5).length;
        const excellentCount = studentGrades.filter(s => s.overallGPA !== null && s.overallGPA >= 8).length;
        
        return (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">📊 Thống kê lớp</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Tổng số học sinh</p>
                <p className="text-2xl font-bold text-indigo-600">{studentGrades.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Điểm TB lớp</p>
                <p className="text-2xl font-bold text-purple-600">{classAverage.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Số HS đạt (≥5)</p>
                <p className="text-2xl font-bold text-green-600">{passCount}</p>
                <p className="text-xs text-gray-500">{((passCount / studentGrades.length) * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Số HS giỏi (≥8)</p>
                <p className="text-2xl font-bold text-yellow-600">{excellentCount}</p>
                <p className="text-xs text-gray-500">{((excellentCount / studentGrades.length) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
