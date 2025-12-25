import { useState } from 'react';
import { User } from '../App';
import { GraduationCap } from 'lucide-react';
import { api, setAuthToken } from '../api/client';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, password);
      setAuthToken(response.token);

      const u = response.user || {};
      onLogin({
        id: u.MaNguoiDung || u.id || username,
        name: u.TenNguoiDung || u.HoVaTen || u.TenDangNhap || username,
        email: u.Email || username,
        role: (u.VaiTro || u.role || 'student') as
          | 'admin'
          | 'student'
          | 'teacher',
      });
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      setError(
        serverMessage ||
          err.message ||
          'Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-4 rounded-full w-16 h-16 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-center text-indigo-900 mb-2">Hệ thống Quản lý Học sinh</h1>
        <p className="text-center text-gray-600 mb-8">Đăng nhập để tiếp tục</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-2">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Registration removed as requested */}
      </div>
    </div>
  );
}
