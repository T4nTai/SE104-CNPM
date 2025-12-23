import { useEffect, useState } from 'react';
import { User } from '../../App';
import { api } from '../../api/client';

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const [fullName, setFullName] = useState<string>(user.name || '');
  const [email, setEmail] = useState<string>(user.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        setMessage('');
        const numericId = Number(user.id);
        if (!Number.isNaN(numericId)) {
          const info = await api.getNguoiDung(numericId);
          setFullName(info.HoVaTen || user.name || '');
          setEmail(info.Email || user.email || '');
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [user.id]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const numericId = Number(user.id);
      if (Number.isNaN(numericId)) {
        throw new Error('Không xác định được mã người dùng');
      }
      await api.updateNguoiDung(numericId, {
        HoVaTen: fullName,
        Email: email,
      });
      setMessage('Đã cập nhật thông tin tài khoản');
    } catch (e: any) {
      setError(e?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('Mật khẩu mới phải từ 6 ký tự');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      const numericId = Number(user.id);
      if (Number.isNaN(numericId)) {
        throw new Error('Không xác định được mã người dùng');
      }
      // Prefer admin reset endpoint for admin, otherwise update self
      if (user.role === 'admin') {
        await api.resetMatKhau(numericId, newPassword);
      } else {
        // Backend should verify current password if implemented; send new password
        await api.updateNguoiDung(numericId, { MatKhau: newPassword });
      }
      setMessage('Đã đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={user.role === 'admin' ? 'text-indigo-900 mb-6' : user.role === 'teacher' ? 'text-green-900 mb-6' : 'text-blue-900 mb-6'}>
        Chỉnh sửa thông tin tài khoản
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-sm max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}
        {message && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{message}</div>
        )}

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm max-w-xl">
        <h2 className="text-gray-900 mb-4">Đổi mật khẩu</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>
    </div>
  );
}
