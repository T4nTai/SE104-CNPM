import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { apiClient } from '../../api/client';

interface Permission {
  maQuyen: number;
  PhanQuyenHeThong: boolean;
  ThayDoiThamSo: boolean;
  LapBaoCao: boolean;
  TraCuuHocSinh: boolean;
  TraCuuDiem: boolean;
  NhapDiem: boolean;
}

export function PermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Permission, 'maQuyen'>>({
    PhanQuyenHeThong: false,
    ThayDoiThamSo: false,
    LapBaoCao: false,
    TraCuuHocSinh: false,
    TraCuuDiem: false,
    NhapDiem: false,
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/quyen');
      const data = (res.data && (res.data.data || res.data)) || [];
      setPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      // fallback to empty list on error
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await apiClient.put(`/admin/quyen/${editingId}`, formData);
        setPermissions(permissions.map(p => 
          p.maQuyen === editingId ? ({ ...formData, maQuyen: editingId } as Permission) : p
        ));
        setEditingId(null);
      } else {
        const res = await apiClient.post('/admin/quyen', formData);
        const created = (res.data && (res.data.data || res.data)) || null;
        if (created) {
          setPermissions([...permissions, created]);
        } else {
          // fallback: add local temporary entry
          const newPermission: Permission = { ...formData, maQuyen: Date.now() } as Permission;
          setPermissions([...permissions, newPermission]);
        }
        setIsAdding(false);
      }
      resetForm();
    } catch (err: any) {
      // basic error feedback
      alert(err?.message || 'Lỗi khi lưu quyền');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingId(permission.maQuyen);
    setFormData({
      PhanQuyenHeThong: permission.PhanQuyenHeThong,
      ThayDoiThamSo: permission.ThayDoiThamSo,
      LapBaoCao: permission.LapBaoCao,
      TraCuuHocSinh: permission.TraCuuHocSinh,
      TraCuuDiem: permission.TraCuuDiem,
      NhapDiem: permission.NhapDiem
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa quyền này?')) return;
    setLoading(true);
    try {
      await apiClient.delete(`/admin/quyen/${id}`);
      setPermissions(permissions.filter(p => p.maQuyen !== id));
    } catch (err) {
      // fallback to local delete
      setPermissions(permissions.filter(p => p.maQuyen !== id));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      PhanQuyenHeThong: false,
      ThayDoiThamSo: false,
      LapBaoCao: false,
      TraCuuHocSinh: false,
      TraCuuDiem: false,
      NhapDiem: false
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const getPermissionBadge = (value: boolean) => (
    <span className={`px-3 py-1 rounded-full text-sm ${
      value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {value ? 'Có' : 'Không'}
    </span>
  );

  const permissionFields = [
    { key: 'PhanQuyenHeThong', label: 'Phân quyền hệ thống', description: 'Cho phép quản lý người dùng và phân quyền' },
    { key: 'ThayDoiThamSo', label: 'Thay đổi tham số', description: 'Cho phép thay đổi các tham số hệ thống' },
    { key: 'LapBaoCao', label: 'Lập báo cáo', description: 'Cho phép lập báo cáo các thông tin cần thiết' },
    { key: 'TraCuuHocSinh', label: 'Tra cứu học sinh', description: 'Cho phép tra cứu thông tin học sinh' },
    { key: 'TraCuuDiem', label: 'Tra cứu điểm', description: 'Cho phép xem điểm của học sinh' },
    { key: 'NhapDiem', label: 'Nhập điểm', description: 'Cho phép nhập điểm cho học sinh' }
  ];

  return (
    <div>
      <h1 className="text-blue-900 mb-6">Quản lý quyền</h1>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <p className="text-blue-900">
          <strong>Lưu ý:</strong> Mỗi quyền xác định các chức năng mà nhóm người dùng có thể thực hiện trong hệ thống. 
          Giá trị 1 = Có quyền, 0 = Không có quyền.
        </p>
      </div>

      {/* Add Button */}
      <div className="flex justify-end items-center mb-6">
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Thêm quyền mới
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-blue-900 mb-4">
            {editingId ? 'Chỉnh sửa quyền' : 'Thêm quyền mới'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              {permissionFields.map((field) => (
                <div key={field.key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <label className="block text-gray-900">{field.label}</label>
                      <p className="text-sm text-gray-600">{field.description}</p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.key}
                          value="1"
                          checked={formData[field.key as keyof typeof formData] === true}
                          onChange={() => setFormData({ ...formData, [field.key]: true })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-green-700">Có</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.key}
                          value="0"
                          checked={formData[field.key as keyof typeof formData] === false}
                          onChange={() => setFormData({ ...formData, [field.key]: false })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-red-700">Không</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-5 h-5" />
                {editingId ? 'Cập nhật' : 'Lưu'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                <X className="w-5 h-5" />
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permissions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Mã quyền</th>
                <th className="px-6 py-3 text-center text-gray-700">Phân quyền HT</th>
                <th className="px-6 py-3 text-center text-gray-700">Thay đổi tham số</th>
                <th className="px-6 py-3 text-center text-gray-700">Lập báo cáo</th>
                <th className="px-6 py-3 text-center text-gray-700">Tra cứu học sinh</th>
                <th className="px-6 py-3 text-center text-gray-700">Tra cứu điểm</th>
                <th className="px-6 py-3 text-center text-gray-700">Nhập điểm</th>
                <th className="px-6 py-3 text-center text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.maQuyen} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded">
                      Quyền {permission.maQuyen}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">{getPermissionBadge(permission.PhanQuyenHeThong)}</td>
                  <td className="px-6 py-4 text-center">{getPermissionBadge(permission.ThayDoiThamSo)}</td>
                  <td className="px-6 py-4 text-center">{getPermissionBadge(permission.LapBaoCao)}</td>
                  <td className="px-6 py-4 text-center">{getPermissionBadge(permission.TraCuuHocSinh)}</td>
                  <td className="px-6 py-4 text-center">{getPermissionBadge(permission.TraCuuDiem)}</td>
                  <td className="px-6 py-4 text-center">{getPermissionBadge(permission.NhapDiem)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(permission)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(permission.maQuyen)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Description */}
      <div className="mt-6 bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-gray-900 mb-4">Mô tả chi tiết các quyền:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissionFields.map((field) => (
            <div key={field.key} className="border-l-4 border-blue-500 pl-4">
              <h4 className="text-gray-900">{field.label}</h4>
              <p className="text-sm text-gray-600">{field.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}