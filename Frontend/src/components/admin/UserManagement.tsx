import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, RefreshCw, Key, Upload, Download, CheckSquare, Square } from 'lucide-react';
import { api } from '../../api/client';
import type { NguoiDung, NhomNguoiDung, CreateNguoiDungPayload, ImportSummary } from '../../api/types';

interface FormData extends Omit<CreateNguoiDungPayload, 'sendEmail'> {
  sendEmail: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<NguoiDung[]>([]);
  const [userGroups, setUserGroups] = useState<NhomNguoiDung[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    TenDangNhap: '',
    MatKhau: '',
    HoVaTen: '',
    Email: '',
    MaNhomNguoiDung: 1,
    sendEmail: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchUserGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listNguoiDung();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const data = await api.listNhomNguoiDung();
      setUserGroups(data);
      if (data.length > 0 && !formData.MaNhomNguoiDung) {
        setFormData(prev => ({ ...prev, MaNhomNguoiDung: data[0].MaNhomNguoiDung }));
      }
    } catch (err: any) {
      console.error('Error fetching user groups:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách nhóm người dùng');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        // Update user
        const payload: any = {
          TenDangNhap: formData.TenDangNhap,
          HoVaTen: formData.HoVaTen,
          Email: formData.Email,
          MaNhomNguoiDung: formData.MaNhomNguoiDung,
        };
        
        // Only include password if it's changed
        if (formData.MatKhau) {
          payload.MatKhau = formData.MatKhau;
        }

        await api.updateNguoiDung(editingId, payload);
        alert('Cập nhật người dùng thành công!');
      } else {
        // Create new user
        const payload: CreateNguoiDungPayload = {
          TenDangNhap: formData.TenDangNhap,
          MatKhau: formData.MatKhau,
          HoVaTen: formData.HoVaTen,
          Email: formData.Email,
          MaNhomNguoiDung: formData.MaNhomNguoiDung,
          sendEmail: formData.sendEmail,
        };

        await api.createNguoiDung(payload);
        alert(
          formData.sendEmail && formData.Email
            ? 'Tạo người dùng thành công! Thông tin đăng nhập đã được gửi qua email.'
            : 'Tạo người dùng thành công!'
        );
      }

      await fetchUsers();
      resetForm();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (user: NguoiDung) => {
    // If the user's group isn't currently in the filtered list, fetch full groups so the role select shows it
    const hasGroup = userGroups.some(g => g.MaNhomNguoiDung === user.MaNhomNguoiDung);
    if (!hasGroup) {
      try {
        const allGroups = await api.listNhomNguoiDung();
        setUserGroups(allGroups);
      } catch (err: any) {
        console.error('Error fetching full user groups:', err);
      }
    }

    setEditingId(user.MaNguoiDung);
    setFormData({
      TenDangNhap: user.TenDangNhap,
      MatKhau: '', // Don't populate password for security
      HoVaTen: user.HoVaTen || '',
      Email: user.Email || '',
      MaNhomNguoiDung: user.MaNhomNguoiDung,
      sendEmail: false,
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) return;

    setLoading(true);
    setError(null);

    try {
      await api.deleteNguoiDung(id);
      alert('Xóa người dùng thành công!');
      await fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Không thể xóa người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (id: number, username: string) => {
    const newPassword = prompt(`Nhập mật khẩu mới cho "${username}":`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.resetMatKhau(id, newPassword);
      alert('Đặt lại mật khẩu thành công!');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      TenDangNhap: '',
      MatKhau: '',
      HoVaTen: '',
      Email: '',
      MaNhomNguoiDung: userGroups[0]?.MaNhomNguoiDung || 1,
      sendEmail: true,
    });
    setIsAdding(false);
    setEditingId(null);
    setError(null);
  };

  const handleDownloadTemplate = () => {
    const csv = [
      ['Tên đăng nhập', 'Mật khẩu', 'Họ và tên', 'Email', 'Nhóm người dùng', 'Gửi thông tin đăng nhập qua email'].join(','),
      ['giaovien01', '123456', 'Nguyen Van A', 'giaovien01@school.com', 'teacher', 'yes'].join(','),
      ['giaovien02', '123456', 'Tran Thi B', 'giaovien02@school.com', 'teacher', 'no'].join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Vui lòng chọn file CSV/XLSX');
      return;
    }
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const result = await api.importNguoiDung(importFile);
      setImportResult(result as ImportSummary);
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể nhập file');
    } finally {
      setImporting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.HoVaTen?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      u.TenDangNhap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.Email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchGroup = selectedGroup === 'all' || u.MaNhomNguoiDung === selectedGroup;
    return matchSearch && matchGroup;
  });

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u.MaNguoiDung));
  const someSelected = filteredUsers.some(u => selectedUsers.has(u.MaNguoiDung));

  const handleSelectAll = () => {
    if (allSelected) {
      filteredUsers.forEach(u => selectedUsers.delete(u.MaNguoiDung));
      setSelectedUsers(new Set(selectedUsers));
    } else {
      const newSelected = new Set(selectedUsers);
      filteredUsers.forEach(u => newSelected.add(u.MaNguoiDung));
      setSelectedUsers(newSelected);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }
      console.log('Selected users:', Array.from(newSelected)); // Debug log
      return newSelected;
    });
  };

  const handleBulkDelete = async () => {
    console.log('handleBulkDelete called with users:', Array.from(selectedUsers)); // Debug log
    if (selectedUsers.size === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedUsers.size} người dùng đã chọn?`)) return;

    setLoading(true);
    let deleted = 0;
    let failed = 0;

    for (const userId of selectedUsers) {
      try {
        console.log(`Deleting user ${userId}`); // Debug log
        await api.deleteNguoiDung(userId);
        deleted += 1;
      } catch (err) {
        console.error(`Failed to delete user ${userId}:`, err); // Debug log
        failed += 1;
      }
    }

    setSelectedUsers(new Set());
    await fetchUsers();
    setLoading(false);
    alert(`Đã xóa ${deleted} người dùng. ${failed > 0 ? failed + ' lỗi.' : ''}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Quản lý người dùng</h1>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Selection Info */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-blue-900 font-medium">
            Đã chọn {selectedUsers.size} người dùng
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="flex items-center gap-2 bg-white border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Xóa {selectedUsers.size} mục
            </button>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, tên đăng nhập, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả nhóm</option>
              {userGroups.map((group) => (
                <option key={group.MaNhomNguoiDung} value={group.MaNhomNguoiDung}>
                  {group.TenNhomNguoiDung}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Import from CSV/Excel */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-gray-900 font-medium">Nhập người dùng từ CSV/Excel</p>
            <p className="text-gray-500 text-sm">Cột bắt buộc: Tên đăng nhập, Mật khẩu, Họ và tên, Email. Có thể điền Nhóm người dùng.</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <input
            type="file"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Đang nhập...' : 'Nhập file'}
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <Download className="w-4 h-4" />
              Tải mẫu CSV
            </button>
          </div>
        </div>
        {importResult && (
          <div className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p>Kết quả: {importResult.imported}/{importResult.total} thành công, {importResult.failed} lỗi.</p>
            {importResult.errors.length > 0 && (
              <ul className="list-disc list-inside text-red-700 mt-2 space-y-1 max-h-28 overflow-y-auto">
                {importResult.errors.slice(0, 5).map((err, idx) => (
                  <li key={`${err.row}-${idx}`}>Dòng {err.row}: {err.message}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li className="text-red-600">... và {importResult.errors.length - 5} lỗi khác</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Add Button & Bulk Actions */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Thêm người dùng
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            {editingId ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.TenDangNhap}
                  onChange={(e) => setFormData({ ...formData, TenDangNhap: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="giaovien01"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Mật khẩu {editingId ? '(để trống nếu không đổi)' : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={formData.MatKhau}
                  onChange={(e) => setFormData({ ...formData, MatKhau: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.HoVaTen}
                  onChange={(e) => setFormData({ ...formData, HoVaTen: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nguyễn Văn A"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@school.com"
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2 font-medium">
                  Nhóm người dùng <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.MaNhomNguoiDung}
                  onChange={(e) => setFormData({ ...formData, MaNhomNguoiDung: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {userGroups.map((group) => (
                    <option key={group.MaNhomNguoiDung} value={group.MaNhomNguoiDung}>
                      {group.TenNhomNguoiDung}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Send Email Checkbox (only for new users) */}
            {!editingId && (
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-gray-700">Gửi thông tin đăng nhập qua email</span>
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Lưu'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <button
                    onClick={handleSelectAll}
                    className="hover:bg-gray-200 p-1 rounded"
                    title={allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  >
                    {allSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : someSelected ? (
                      <div className="w-5 h-5 border-2 border-blue-600 rounded bg-blue-50" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên đăng nhập
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ và tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhóm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.MaNguoiDung} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleSelectUser(user.MaNguoiDung)}
                        className="hover:bg-gray-100 p-1 rounded"
                      >
                        {selectedUsers.has(user.MaNguoiDung) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.MaNguoiDung}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.TenDangNhap}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.HoVaTen || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.Email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.nhom?.TenNhomNguoiDung?.toLowerCase().includes('admin')
                            ? 'bg-purple-100 text-purple-700'
                            : user.nhom?.TenNhomNguoiDung?.toLowerCase().includes('giáo viên')
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {user.nhom?.TenNhomNguoiDung || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.MaNguoiDung, user.TenDangNhap)}
                          disabled={loading}
                          className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
                          title="Đặt lại mật khẩu"
                        >
                          <Key className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.MaNguoiDung, user.TenDangNhap)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {!loading && users.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Hiển thị {filteredUsers.length} / {users.length} người dùng
        </div>
      )}
    </div>
  );
}