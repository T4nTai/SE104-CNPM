import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FileText, Download } from 'lucide-react';
import { api } from '../../api/client';

interface ClassReportData {
  className: string;
  totalStudents: number;
  excellent: number;
  good: number;
  average: number;
  poor: number;
  averageScore: number;
  passed: number; // Số học sinh đạt
}

const MOCK_CLASS_DATA: ClassReportData[] = [];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const CATEGORY_COLORS: Record<string, string> = {
  'Xuất sắc': '#10b981', // green
  'Giỏi': '#3b82f6',      // blue
  'Trung bình': '#f59e0b',// amber
  'Yếu': '#ef4444',       // red
};

const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const color = CATEGORY_COLORS[name] || '#374151';
  const text = `${name}: ${(percent * 100).toFixed(0)}%`;
  return (
    <text x={x} y={y} fill={color} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {text}
    </text>
  );
};

export function SemesterReport() {
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [selectedClass, setSelectedClass] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{
    TongSoHocSinh: number;
    SoLuongDat: number;
    TiLeDat: number;
    PhanBo?: { XuatSac: number; Gioi: number; TrungBinh: number; Yeu: number };
    DiemTBHK_TB?: number | null;
  } | null>(null);

  useEffect(() => {
    api.listAcademicYears()
      .then((yrs) => {
        setYears(yrs || []);
        if (yrs?.length) setSelectedYear(yrs[0].MaNamHoc || yrs[0].MaNH || yrs[0].id || yrs[0].MaNam || '');
      })
      .catch((e) => setError(e.message || 'Không tải được năm học'));
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    Promise.all([
      api.listSemesters({ MaNamHoc: Number(selectedYear) }),
      api.listClasses({ MaNamHoc: Number(selectedYear) }),
    ])
      .then(([sems, cls]) => {
        setSemesters(sems || []);
        setClasses(cls || []);
        if (sems?.length) setSelectedSemester(sems[0].MaHocKy || sems[0].MaHK || sems[0].id || '');
        if (cls?.length) setSelectedClass(cls[0].MaLop || cls[0].id || '');
      })
      .catch((e) => setError(e.message || 'Không tải được học kỳ/lớp'));
  }, [selectedYear]);

  const fetchReport = async () => {
    if (!selectedYear || !selectedSemester || !selectedClass) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReportBySemesterAndClass({
        MaNamHoc: Number(selectedYear),
        MaHocKy: Number(selectedSemester),
        MaLop: Number(selectedClass),
      });
      setReport({
        TongSoHocSinh: data.TongSoHocSinh ?? 0,
        SoLuongDat: data.SoLuongDat ?? 0,
        TiLeDat: data.TiLeDat ?? 0,
        PhanBo: data.PhanBo || { XuatSac: 0, Gioi: 0, TrungBinh: 0, Yeu: 0 },
        DiemTBHK_TB: data.DiemTBHK_TB ?? null,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Không lấy được báo cáo học kỳ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedSemester, selectedClass]);

  const pieData = useMemo(() => {
    const cat = report?.PhanBo || { XuatSac: 0, Gioi: 0, TrungBinh: 0, Yeu: 0 };
    // Ẩn các hạng mục có giá trị 0
    return [
      { name: 'Xuất sắc', value: cat.XuatSac },
      { name: 'Giỏi', value: cat.Gioi },
      { name: 'Trung bình', value: cat.TrungBinh },
      { name: 'Yếu', value: cat.Yeu },
    ].filter((d) => Number(d.value) > 0);
  }, [report]);

  const visibleLegend = useMemo(() => pieData.map((d) => d.name), [pieData]);

  const barData = useMemo(() => {
    return [{ name: 'Tỉ lệ đạt', 'Tỉ lệ (%)': report?.TiLeDat ?? 0 }];
  }, [report]);

  const exportCsv = () => {
    if (!report) return;
    const lines: string[] = [];
    const header = ['Xuất sắc', 'Giỏi', 'Trung bình', 'Yếu', 'Sĩ số', 'Số đạt', 'Tỉ lệ đạt (%)', 'ĐTB HK'];
    lines.push(header.join(','));
    lines.push([
      report.PhanBo?.XuatSac ?? 0,
      report.PhanBo?.Gioi ?? 0,
      report.PhanBo?.TrungBinh ?? 0,
      report.PhanBo?.Yeu ?? 0,
      report.TongSoHocSinh ?? 0,
      report.SoLuongDat ?? 0,
      report.TiLeDat ?? 0,
      report.DiemTBHK_TB ?? '',
    ].join(','));

    const blob = new Blob(["\ufeff" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCaoHocKy_${selectedYear}_${selectedSemester}_${selectedClass}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          <h1 className="text-indigo-900">Báo cáo tổng kết học kỳ</h1>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Download className="w-5 h-5" />
          Xuất báo cáo
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Năm học</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {years.map((y) => (
                <option key={y.MaNamHoc || y.MaNH || y.id}
                        value={y.MaNamHoc || y.MaNH || y.id}>
                  {y.NamHoc || y.TenNamHoc || `${y.Nam1}-${y.Nam2}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {semesters.map((s) => (
                <option key={s.MaHocKy || s.MaHK || s.id} value={s.MaHocKy || s.MaHK || s.id}>
                  {s.TenHK || `Học kỳ ${s.MaHocKy || s.MaHK}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Lớp</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((c) => (
                <option key={c.MaLop || c.id} value={c.MaLop || c.id}>
                  {c.TenLop}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
            <p className="text-gray-700 mb-1">Sĩ số</p>
            <p className="text-gray-900">{report?.TongSoHocSinh ?? 0}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-green-700 mb-1">Số đạt</p>
            <p className="text-green-900">{report?.SoLuongDat ?? 0}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
            <p className="text-indigo-700 mb-1">Tỉ lệ đạt</p>
            <p className="text-indigo-900">{report?.TiLeDat ?? 0}%</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
            <p className="text-yellow-700 mb-1">ĐTB HK</p>
            <p className="text-yellow-900">{report?.DiemTBHK_TB ?? '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-gray-900 mb-4 text-center">Phân bố xếp loại</h3>
            <div className="flex flex-wrap items-center gap-3 justify-center text-sm mb-3">
              {Object.entries(CATEGORY_COLORS)
                .filter(([name]) => visibleLegend.includes(name))
                .map(([name, color]) => (
                <span key={name} className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: color }}></span>
                  <span className="text-gray-700">{name}</span>
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine
                  label={renderPieLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-gray-900 mb-4 text-center">Tỉ lệ đạt (lớp đã chọn)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="Tỉ lệ (%)" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-gray-700">Xuất sắc</th>
              <th className="px-6 py-4 text-left text-gray-700">Giỏi</th>
              <th className="px-6 py-4 text-left text-gray-700">Trung bình</th>
              <th className="px-6 py-4 text-left text-gray-700">Yếu</th>
              <th className="px-6 py-4 text-left text-gray-700">Sĩ số</th>
              <th className="px-6 py-4 text-left text-gray-700">Số đạt</th>
              <th className="px-6 py-4 text-left text-gray-700">Tỉ lệ đạt</th>
              <th className="px-6 py-4 text-left text-gray-700">ĐTB HK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-gray-900">{report?.PhanBo?.XuatSac ?? 0}</td>
              <td className="px-6 py-4 text-gray-900">{report?.PhanBo?.Gioi ?? 0}</td>
              <td className="px-6 py-4 text-gray-900">{report?.PhanBo?.TrungBinh ?? 0}</td>
              <td className="px-6 py-4 text-gray-900">{report?.PhanBo?.Yeu ?? 0}</td>
              <td className="px-6 py-4 text-gray-900">{report?.TongSoHocSinh ?? 0}</td>
              <td className="px-6 py-4 text-gray-900">{report?.SoLuongDat ?? 0}</td>
              <td className="px-6 py-4 text-gray-900">{report?.TiLeDat ?? 0}%</td>
              <td className="px-6 py-4 text-gray-900">{report?.DiemTBHK_TB ?? '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}