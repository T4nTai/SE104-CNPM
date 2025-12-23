import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { FileText, Download } from 'lucide-react';
import { api } from '../../api/client';

interface SubjectReportData {
  subject: string;
  excellent: number;
  good: number;
  average: number;
  poor: number;
  totalStudents: number;
  averageScore: number;
  passed: number; // Số học sinh đạt (điểm >= 5)
}

const MOCK_DATA: SubjectReportData[] = [];

export function SubjectReport() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Array<{ MaLop: number; TenLop: string; TongSoHocSinh: number; SoLuongDat: number; TiLeDat: number; PhanBo?: { XuatSac: number; Gioi: number; TrungBinh: number; Yeu: number }; DiemTBMon_TB?: number | null }>>([]);
  const [summary, setSummary] = useState<{ TongSoHocSinh: number; TongSoLuongDat: number; TongTiLeDat: number; TongPhanBo?: { XuatSac: number; Gioi: number; TrungBinh: number; Yeu: number }; DiemTBMon_TB?: number | null } | null>(null);

  useEffect(() => {
    // Load subjects and years on mount
    Promise.all([api.listSubjects(), api.listAcademicYears()])
      .then(([subs, yrs]) => {
        setSubjects(subs || []);
        setYears(yrs || []);
        if (yrs?.length) setSelectedYear(yrs[0].MaNamHoc || yrs[0].MaNH || yrs[0].id || yrs[0].MaNam || '');
        if (subs?.length) setSelectedSubject(subs[0].MaMonHoc || subs[0].MaMon || subs[0].id || '');
      })
      .catch((e) => setError(e.message || 'Không tải được danh mục'));
  }, []);

  useEffect(() => {
    // Load semesters and classes when year changes
    if (!selectedYear) return;
    Promise.all([
      api.listSemesters({ MaNamHoc: Number(selectedYear) }),
      api.listClasses({ MaNamHoc: Number(selectedYear) }),
    ])
      .then(([sems, cls]) => {
        setSemesters(sems || []);
        setClasses(cls || []);
        if (sems?.length) setSelectedSemester(sems[0].MaHocKy || sems[0].MaHK || sems[0].id || '');
      })
      .catch((e) => setError(e.message || 'Không tải được học kỳ/lớp'));
  }, [selectedYear]);

  const fetchReport = async () => {
    if (!selectedYear || !selectedSemester || !selectedSubject) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReportBySubject({
        MaNamHoc: Number(selectedYear),
        MaHocKy: Number(selectedSemester),
        MaMon: Number(selectedSubject),
      });
      setSummary({
        TongSoHocSinh: data.TongSoHocSinh ?? 0,
        TongSoLuongDat: data.TongSoLuongDat ?? 0,
        TongTiLeDat: data.TongTiLeDat ?? 0,
        TongPhanBo: data.TongPhanBo || { XuatSac: 0, Gioi: 0, TrungBinh: 0, Yeu: 0 },
        DiemTBMon_TB: data.DiemTBMon_TB ?? null,
      });
      setDetails(Array.isArray(data.ChiTietTheoLop) ? data.ChiTietTheoLop : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Không lấy được báo cáo môn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedSemester, selectedSubject]);

  const chartData = useMemo(() => {
    // Overall category distribution (ẩn mục có giá trị 0)
    const cat = summary?.TongPhanBo || { XuatSac: 0, Gioi: 0, TrungBinh: 0, Yeu: 0 };
    return [
      { name: 'Xuất sắc', 'Số lượng': cat.XuatSac },
      { name: 'Giỏi', 'Số lượng': cat.Gioi },
      { name: 'Trung bình', 'Số lượng': cat.TrungBinh },
      { name: 'Yếu', 'Số lượng': cat.Yeu },
    ].filter((d) => Number(d['Số lượng']) > 0);
  }, [summary]);

  const CATEGORY_COLORS: Record<string, string> = {
    'Xuất sắc': '#10b981', // green
    'Giỏi': '#3b82f6',      // blue
    'Trung bình': '#f59e0b',// amber
    'Yếu': '#ef4444',       // red
  };

  const exportCsv = () => {
    if (!summary) return;
    const lines: string[] = [];
    const header = ['Lớp', 'Sĩ số', 'Xuất sắc', 'Giỏi', 'Trung bình', 'Yếu', 'Số đạt', 'Tỉ lệ đạt (%)', 'ĐTB Môn'];
    lines.push(header.join(','));
    details.forEach((r) => {
      lines.push([
        r.TenLop || r.MaLop,
        r.TongSoHocSinh ?? 0,
        r.PhanBo?.XuatSac ?? 0,
        r.PhanBo?.Gioi ?? 0,
        r.PhanBo?.TrungBinh ?? 0,
        r.PhanBo?.Yeu ?? 0,
        r.SoLuongDat ?? 0,
        r.TiLeDat ?? 0,
        r.DiemTBMon_TB ?? '',
      ].join(','));
    });
    lines.push(['Tổng', summary.TongSoHocSinh ?? 0, summary.TongPhanBo?.XuatSac ?? 0, summary.TongPhanBo?.Gioi ?? 0, summary.TongPhanBo?.TrungBinh ?? 0, summary.TongPhanBo?.Yeu ?? 0, summary.TongSoLuongDat ?? 0, summary.TongTiLeDat ?? 0, summary.DiemTBMon_TB ?? ''].join(','));

    const blob = new Blob(["\ufeff" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCaoMon_${selectedYear}_${selectedSemester}_${selectedSubject}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          <h1 className="text-indigo-900">Báo cáo tổng kết môn học</h1>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Download className="w-5 h-5" />
          Xuất báo cáo
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <label className="block text-gray-700 mb-2">Môn học</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map((m) => (
                <option key={m.MaMonHoc || m.MaMon} value={m.MaMonHoc || m.MaMon}>
                  {m.TenMonHoc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-600">Lỗi: {error}</div>
        )}

        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Phân bố xếp loại (toàn bộ)</h3>
          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
            {Object.entries(CATEGORY_COLORS)
              .filter(([name]) => chartData.some((d) => d.name === name))
              .map(([name, color]) => (
              <span key={name} className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: color }}></span>
                <span className="text-gray-700">{name}</span>
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Số lượng">
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={CATEGORY_COLORS[entry.name] || '#10b981'} />
                ))}
                <LabelList dataKey="Số lượng" position="top" fill="#374151" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-gray-700">Lớp</th>
              <th className="px-6 py-4 text-left text-gray-700">Sĩ số</th>
              <th className="px-6 py-4 text-left text-gray-700">Xuất sắc</th>
              <th className="px-6 py-4 text-left text-gray-700">Giỏi</th>
              <th className="px-6 py-4 text-left text-gray-700">Trung bình</th>
              <th className="px-6 py-4 text-left text-gray-700">Yếu</th>
              <th className="px-6 py-4 text-left text-gray-700">Số đạt</th>
              <th className="px-6 py-4 text-left text-gray-700">Tỉ lệ đạt (%)</th>
              <th className="px-6 py-4 text-left text-gray-700">ĐTB Môn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {details.map((row) => (
              <tr key={row.MaLop} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900">{row.TenLop || row.MaLop}</td>
                <td className="px-6 py-4 text-gray-600">{row.TongSoHocSinh}</td>
                <td className="px-6 py-4 text-gray-900">
                  <span className="px-2 py-1 rounded bg-green-50 text-green-700">{row.PhanBo?.XuatSac ?? 0}</span>
                </td>
                <td className="px-6 py-4 text-gray-900">
                  <span className="px-2 py-1 rounded bg-blue-50 text-blue-700">{row.PhanBo?.Gioi ?? 0}</span>
                </td>
                <td className="px-6 py-4 text-gray-900">
                  <span className="px-2 py-1 rounded bg-amber-50 text-amber-700">{row.PhanBo?.TrungBinh ?? 0}</span>
                </td>
                <td className="px-6 py-4 text-gray-900">
                  <span className="px-2 py-1 rounded bg-red-50 text-red-700">{row.PhanBo?.Yeu ?? 0}</span>
                </td>
                <td className="px-6 py-4 text-gray-900">{row.SoLuongDat}</td>
                <td className="px-6 py-4 text-gray-900">{row.TiLeDat}</td>
                <td className="px-6 py-4 text-gray-900">{row.DiemTBMon_TB ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}