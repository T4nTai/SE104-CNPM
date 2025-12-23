import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { User } from '../../App';

interface Props {
  user: User;
}

interface HomeroomItem {
  MaLop: number;
  TenLop: string;
  Khoi: string | null;
  NamHoc: string | null;
}

interface SubjectItem {
  MaBangDiemMon: number;
  MaLop: number;
  TenLop: string | null;
  Khoi: string | null;
  NamHoc: string | null;
  MaHocKy: number;
  TenHocKy: string | null;
  MaMon: number;
  TenMonHoc: string | null;
}

export function Assignments({ user }: Props) {
  const [homeroom, setHomeroom] = useState<HomeroomItem[]>([]);
  const [subject, setSubject] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[Assignments] Loading assignments (JWT-based)');
        const data = await api.getTeacherAssignments(); // No MaGV param - use JWT
        console.log('[Assignments] Received data:', {
          homeroom: data?.homeroom?.length || 0,
          subject: data?.subject?.length || 0,
          sampleSubject: data?.subject?.[0]
        });
        setHomeroom(data?.homeroom || []);
        setSubject(data?.subject || []);
      } catch (e: any) {
        console.error('[Assignments] Error loading:', e);
        setError(e?.message || 'Không tải được phân công');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-green-900">Phân công của tôi</h1>
        {error && <div className="mt-3 p-3 rounded bg-red-100 text-red-700">{error}</div>}
        {loading && <div className="mt-3 text-gray-600">Đang tải...</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-gray-900 mb-3">Giáo viên chủ nhiệm</h2>
          {homeroom.length === 0 ? (
            <p className="text-gray-600">Chưa được phân công làm GVCN.</p>
          ) : (
            <ul className="space-y-3">
              {homeroom.map((c) => (
                <li key={c.MaLop} className="p-3 border rounded-lg flex justify-between items-center">
                  <div>
                    <div className="text-gray-900 font-medium">{c.TenLop}</div>
                    <div className="text-sm text-gray-600">Khối: {c.Khoi || '—'} · Năm học: {c.NamHoc || '—'}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">GVCN</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-gray-900 mb-3">Giáo viên bộ môn</h2>
          {subject.length === 0 ? (
            <p className="text-gray-600">Chưa được phân công giảng dạy môn.</p>
          ) : (
            <ul className="space-y-3">
              {subject.map((s, idx) => (
                <li key={`${s.MaBangDiemMon}-${idx}`} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-gray-900 font-medium">{s.TenMonHoc || 'Môn học'}</div>
                      <div className="text-sm text-gray-600">Lớp: {s.TenLop || '—'} · Khối: {s.Khoi || '—'}</div>
                      <div className="text-sm text-gray-600">Học kỳ: {s.TenHocKy || s.MaHocKy} · Năm học: {s.NamHoc || '—'}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">Giảng dạy</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
