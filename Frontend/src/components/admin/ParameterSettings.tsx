import { useEffect, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { api } from '../../api/client';

interface SystemParameters {
  minAge: number;
  maxAge: number;
  maxStudentsPerClass: number;
  diemDatMon: number;
  diemDatHocKy: number;
  gradeWeight: {
    mieng15Phut: number;
    mot1Tiet: number;
    giuaKy: number;
    cuoiKy: number;
  };
}

interface AcademicYear {
  MaNH: number;        // Primary key from backend
  Nam1: number;        // Start year
  Nam2: number;        // End year
  name: string;        // Display name: "Nam1-Nam2"
}

const INITIAL_PARAMS: SystemParameters = {
  minAge: 0,
  maxAge: 0,
  maxStudentsPerClass: 0,
  diemDatMon: 0,
  diemDatHocKy: 0,
  gradeWeight: {
    mieng15Phut: 0,
    mot1Tiet: 0,
    giuaKy: 0,
    cuoiKy: 0
  }
};

export function ParameterSettings() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [params, setParams] = useState<SystemParameters>(INITIAL_PARAMS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [deleted, setDeleted] = useState(false);

  // Fetch academic years on mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch parameters when year changes
  useEffect(() => {
    if (selectedYearId) {
      fetchParameters(selectedYearId);
    }
  }, [selectedYearId]);

  async function fetchAcademicYears() {
    try {
      setLoading(true);
      setError('');
      const years = await api.listAcademicYears();
      
      // Map backend response to frontend format
      const mappedYears = years.map((year: any) => ({
        MaNH: year.MaNH,
        Nam1: year.Nam1,
        Nam2: year.Nam2,
        name: `${year.Nam1}-${year.Nam2}`
      }));
      
      const sorted = mappedYears.sort((a: any, b: any) => b.Nam1 - a.Nam1);
      setAcademicYears(sorted);
      
      // Auto-select most recent year
      if (sorted.length > 0 && !selectedYearId) {
        setSelectedYearId(sorted[0].MaNH);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách năm học');
      console.error('Error fetching academic years:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchParameters(MaNH: number) {
    try {
      setLoading(true);
      setError('');
      const resp = await api.getParameters(String(MaNH));
      
      // Map backend response (PascalCase) to frontend state
      const toNum = (v: any) => (typeof v === 'number' && isFinite(v) ? v : undefined);
      const mapped: SystemParameters = {
        diemDatMon: toNum(resp?.DiemDatMon) ?? INITIAL_PARAMS.diemDatMon,
        diemDatHocKy: toNum(resp?.DiemDat) ?? INITIAL_PARAMS.diemDatHocKy,
        maxStudentsPerClass: toNum(resp?.SiSoToiDa) ?? INITIAL_PARAMS.maxStudentsPerClass,
        minAge: toNum(resp?.TuoiToiThieu) ?? INITIAL_PARAMS.minAge,
        maxAge: toNum(resp?.TuoiToiDa) ?? INITIAL_PARAMS.maxAge,
        gradeWeight: {
          mieng15Phut: toNum(resp?.HesoMieng) ?? INITIAL_PARAMS.gradeWeight.mieng15Phut,
          mot1Tiet: toNum(resp?.HesoChinh15p) ?? INITIAL_PARAMS.gradeWeight.mot1Tiet,
          giuaKy: toNum(resp?.HesoGiuaky) ?? INITIAL_PARAMS.gradeWeight.giuaKy,
          cuoiKy: toNum(resp?.HesoCuoiky) ?? INITIAL_PARAMS.gradeWeight.cuoiKy,
        },
      };
      setParams(mapped);
    } catch (err: any) {
      // If 404 or no data, just use defaults
      console.log('Using default parameters (none saved yet for this year)');
      setParams(INITIAL_PARAMS);
      setDeleted(false);
    } finally {
      setLoading(false);
    }
  }

  const handleYearChange = (MaNH: number) => {
    setSelectedYearId(MaNH);
    // Parameters will be fetched by useEffect
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedYearId) {
      setError('Vui lòng chọn năm học');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Validate all values are numbers
      if (!Number.isFinite(params.minAge) || !Number.isFinite(params.maxAge) || 
          !Number.isFinite(params.maxStudentsPerClass) || 
          !Number.isFinite(params.diemDatMon) || !Number.isFinite(params.diemDatHocKy)) {
        setError('Vui lòng nhập tất cả các giá trị số');
        setLoading(false);
        return;
      }
      
      // Map frontend state to backend payload (exactly as backend expects)
      const payload = {
        TuoiToiThieu: Number(params.minAge),
        TuoiToiDa: Number(params.maxAge),
        SiSoToiDa: Number(params.maxStudentsPerClass),
        DiemToiThieu: 0,
        DiemToiDa: 10,
        DiemDatMon: Number(params.diemDatMon),
        DiemDat: Number(params.diemDatHocKy),
        HesoMieng: params.gradeWeight.mieng15Phut || null,
        HesoChinh15p: params.gradeWeight.mot1Tiet || null,
        HesoGiuaky: params.gradeWeight.giuaKy || null,
        HesoCuoiky: params.gradeWeight.cuoiKy || null,
      };

      console.log('[ParameterSettings] MaNH:', selectedYearId);
      console.log('[ParameterSettings] Sending payload:', JSON.stringify(payload, null, 2));
      
      // Cast to align with existing API typing that still uses old field names
      await api.upsertParameters(selectedYearId.toString(), payload as any);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể lưu tham số');
      console.error('Error saving parameters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedYearId) {
      setError('Vui lòng chọn năm học');
      return;
    }
    if (!confirm('Bạn chắc chắn muốn xoá toàn bộ tham số của năm học này?')) return;

    try {
      setLoading(true);
      setError('');
      await api.deleteParameters(selectedYearId.toString());
      setParams(INITIAL_PARAMS);
      setDeleted(true);
      setTimeout(() => setDeleted(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xoá tham số');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-indigo-600" />
        <h1 className="text-indigo-900">Thay đổi tham số hệ thống</h1>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          Đang tải dữ liệu...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Đã lưu thay đổi thành công!
        </div>
      )}

      {deleted && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          Đã xoá tham số của năm học này.
        </div>
      )}

      {/* Select Academic Year for Parameters */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <h2 className="text-gray-900 mb-4">Chọn năm học để thiết lập tham số</h2>
        <select
          value={selectedYearId || ''}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading || academicYears.length === 0}
        >
          <option value="">-- Chọn năm học --</option>
          {academicYears.map((year) => (
            <option key={year.MaNH} value={year.MaNH}>
              {year.name}
            </option>
          ))}
        </select>
        <p className="text-gray-600 mt-2">
          Lưu ý: Năm học được tạo tự động từ học kỳ. Mỗi năm học có thể có tham số riêng biệt.
        </p>
      </div>

      {/* Parameter Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-gray-900 mb-4">Tham số điểm số</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Điểm đạt tối thiểu</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={params.diemDatMon}
                onChange={(e) => setParams({ ...params, diemDatMon: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-gray-600 mt-1">Điểm tối thiểu để đạt môn học</p>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Điểm đạt tối thiểu học kỳ</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={params.diemDatHocKy}
                onChange={(e) => setParams({ ...params, diemDatHocKy: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-gray-600 mt-1">Điểm tối thiểu để đạt học kỳ</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-gray-900 mb-4">Tham số lớp học</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Số học sinh tối đa/lớp</label>
              <input
                type="number"
                min="1"
                value={params.maxStudentsPerClass}
                onChange={(e) => setParams({ ...params, maxStudentsPerClass: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Tuổi học sinh tối thiểu</label>
              <input
                type="number"
                min="1"
                value={params.minAge}
                onChange={(e) => setParams({ ...params, minAge: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Tuổi học sinh tối đa</label>
              <input
                type="number"
                min="1"
                value={params.maxAge}
                onChange={(e) => setParams({ ...params, maxAge: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-gray-900 mb-4">Trọng số điểm</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Điểm miệng 15 phút (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={params.gradeWeight.mieng15Phut}
                onChange={(e) => setParams({ 
                  ...params, 
                  gradeWeight: { ...params.gradeWeight, mieng15Phut: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Điểm một tiết (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={params.gradeWeight.mot1Tiet}
                onChange={(e) => setParams({ 
                  ...params, 
                  gradeWeight: { ...params.gradeWeight, mot1Tiet: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Điểm giữa kỳ (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={params.gradeWeight.giuaKy}
                onChange={(e) => setParams({ 
                  ...params, 
                  gradeWeight: { ...params.gradeWeight, giuaKy: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Điểm cuối kỳ (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={params.gradeWeight.cuoiKy}
                onChange={(e) => setParams({ 
                  ...params, 
                  gradeWeight: { ...params.gradeWeight, cuoiKy: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <p className="text-gray-700">
              Tổng trọng số: {params.gradeWeight.mieng15Phut + params.gradeWeight.mot1Tiet + params.gradeWeight.giuaKy + params.gradeWeight.cuoiKy}%
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !selectedYearId}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Lưu tham số {selectedYearId ? `cho năm học ${academicYears.find(y => y.MaNH === selectedYearId)?.name}` : ''}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || !selectedYearId}
            className="flex items-center gap-2 bg-red-50 text-red-700 px-6 py-3 rounded-lg border border-red-200 hover:bg-red-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Xoá tham số năm
          </button>
        </div>
      </form>
    </div>
  );
}
