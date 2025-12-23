import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface Permission {
  maQuyen: number;
  phanQuyenHeThong: number;
  thayDoiThamSo: number;
  thayDoiQuyDinh: number;
  dieuChinhNghiepVu: number;
  traCuuDiemVaLopHoc: number;
  traCuuHocSinh: number;
}

interface UserGroup {
  maNhomNguoiDung: number;
  tenNhomNguoiDung: string;
  maQuyen: number;
  permission?: Permission;
}

export function UserGroupManagement() {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<UserGroup, 'maNhomNguoiDung' | 'permission'>>({
    tenNhomNguoiDung: '',
    maQuyen: 1
  });

  // Simulate API call to fetch data
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchUserGroups = async (perms: Permission[]) => {
    try {
      const data = await api.listNhomNguoiDung();
      const groups = (data || []).map((g: any) => ({
        maNhomNguoiDung: g.MaNhomNguoiDung || g.maNhomNguoiDung,
        tenNhomNguoiDung: g.TenNhomNguoiDung || g.tenNhomNguoiDung,
        maQuyen: g.MaQuyen || g.maQuyen,
        permission: undefined,
      }));
      const groupsWithPermissions = groups.map((gr: any) => ({
        ...gr,
        permission: perms.find((p) => p.maQuyen === gr.maQuyen),
      }));
      setUserGroups(groupsWithPermissions);
    } catch (err) {
      console.error('Failed to load user groups', err);
      setUserGroups([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await api.listQuyen();
      const mapped = (data || []).map((q: any) => ({
        maQuyen: q.MaQuyen || q.maQuyen,
        phanQuyenHeThong: q.PhanQuyenHeThong ?? q.phanQuyenHeThong ?? 0,
        thayDoiThamSo: q.ThayDoiThamSo ?? q.thayDoiThamSo ?? 0,
        thayDoiQuyDinh: q.ThayDoiQuyDinh ?? q.thayDoiQuyDinh ?? 0,
        dieuChinhNghiepVu: q.DieuChinhNghiepVu ?? q.dieuChinhNghiepVu ?? 0,
        traCuuDiemVaLopHoc: q.TraCuuDiemVaLopHoc ?? q.traCuuDiemVaLopHoc ?? 0,
        traCuuHocSinh: q.TraCuuHocSinh ?? q.traCuuHocSinh ?? 0,
      }));
      setPermissions(mapped);
      // after permissions loaded, fetch groups and attach permissions
      await fetchUserGroups(mapped);
    } catch (err) {
      console.error('Failed to load permissions', err);
      setPermissions([]);
      setUserGroups([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      try {
        await api.updateNhomNguoiDung(editingId, {
          TenNhomNguoiDung: formData.tenNhomNguoiDung,
          MaQuyen: formData.maQuyen,
        });
        setUserGroups(userGroups.map(g => 
          g.maNhomNguoiDung === editingId 
            ? { 
                ...g,
                tenNhomNguoiDung: formData.tenNhomNguoiDung,
                maQuyen: formData.maQuyen,
                permission: permissions.find(p => p.maQuyen === formData.maQuyen),
              } 
            : g
        ));
        setEditingId(null);
      } catch (err) {
        console.error('Failed to update group', err);
      }
    } else {
      try {
        const created = await api.createNhomNguoiDung({
          TenNhomNguoiDung: formData.tenNhomNguoiDung,
          MaQuyen: formData.maQuyen,
        });
        const newGroup: UserGroup = {
          maNhomNguoiDung: created.MaNhomNguoiDung || created.MaNhomNguoiDung,
          tenNhomNguoiDung: created.TenNhomNguoiDung || created.TenNhomNguoiDung,
          maQuyen: created.MaQuyen || created.MaQuyen,
          permission: permissions.find(p => p.maQuyen === (created.MaQuyen || created.MaQuyen)),
        };
        setUserGroups([...userGroups, newGroup]);
        setIsAdding(false);
      } catch (err) {
        console.error('Failed to create group', err);
      }
    }

    resetForm();
  };

  const handleEdit = (group: UserGroup) => {
    setEditingId(group.maNhomNguoiDung);
    setFormData({
      tenNhomNguoiDung: group.tenNhomNguoiDung,
      maQuyen: group.maQuyen
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm người dùng này?')) return;
    try {
      await api.deleteNhomNguoiDung(id);
      setUserGroups(userGroups.filter(g => g.maNhomNguoiDung !== id));
    } catch (err) {
      console.error('Failed to delete group', err);
    }
  };

  const resetForm = () => {
    setFormData({
      tenNhomNguoiDung: '',
      maQuyen: 1
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const getPermissionBadge = (value: number) => (
    <span className={`px-2 py-1 rounded text-xs ${
      value === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {value === 1 ? 'Có' : 'Không'}
    </span>
  );

  return (
    <div>
      <h1 className="text-blue-900 mb-6">Quản lý nhóm người dùng</h1>

      {/* Add Button */}
      <div className="flex justify-end items-center mb-6">
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Thêm nhóm người dùng
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-blue-900 mb-4">
            {editingId ? 'Chỉnh sửa nhóm người dùng' : 'Thêm nhóm người dùng mới'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-2">Tên nhóm người dùng *</label>
                <input
                  type="text"
                  required
                  value={formData.tenNhomNguoiDung}
                  onChange={(e) => setFormData({ ...formData, tenNhomNguoiDung: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Admin"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Quyền *</label>
                <select
                  value={formData.maQuyen}
                  onChange={(e) => setFormData({ ...formData, maQuyen: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {permissions.map(perm => (
                    <option key={perm.maQuyen} value={perm.maQuyen}>
                      Quyền {perm.maQuyen}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Permission Preview */}
            {formData.maQuyen && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="text-gray-900 mb-3">Xem trước quyền:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(() => {
                    const perm = permissions.find(p => p.maQuyen === formData.maQuyen);
                    return perm ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm">Phân quyền hệ thống:</span>
                          {getPermissionBadge(perm.phanQuyenHeThong)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm">Thay đổi tham số:</span>
                          {getPermissionBadge(perm.thayDoiThamSo)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm">Thay đổi quy định:</span>
                          {getPermissionBadge(perm.thayDoiQuyDinh)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm">Điều chỉnh nghiệp vụ:</span>
                          {getPermissionBadge(perm.dieuChinhNghiepVu)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm">Tra cứu điểm/lớp học:</span>
                          {getPermissionBadge(perm.traCuuDiemVaLopHoc)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm">Tra cứu học sinh:</span>
                          {getPermissionBadge(perm.traCuuHocSinh)}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

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

      {/* User Groups Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700">Mã nhóm</th>
              <th className="px-6 py-3 text-left text-gray-700">Tên nhóm</th>
              <th className="px-6 py-3 text-left text-gray-700">Mã quyền</th>
              <th className="px-6 py-3 text-left text-gray-700">Phân quyền HT</th>
              <th className="px-6 py-3 text-left text-gray-700">Thay đổi TS</th>
              <th className="px-6 py-3 text-left text-gray-700">Thay đổi QĐ</th>
              <th className="px-6 py-3 text-left text-gray-700">Điều chỉnh NV</th>
              <th className="px-6 py-3 text-left text-gray-700">Tra cứu</th>
              <th className="px-6 py-3 text-left text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {userGroups.map((group) => (
              <tr key={group.maNhomNguoiDung} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900">{group.maNhomNguoiDung}</td>
                <td className="px-6 py-4 text-gray-900">{group.tenNhomNguoiDung}</td>
                <td className="px-6 py-4 text-gray-600">{group.maQuyen}</td>
                <td className="px-6 py-4">{group.permission && getPermissionBadge(group.permission.phanQuyenHeThong)}</td>
                <td className="px-6 py-4">{group.permission && getPermissionBadge(group.permission.thayDoiThamSo)}</td>
                <td className="px-6 py-4">{group.permission && getPermissionBadge(group.permission.thayDoiQuyDinh)}</td>
                <td className="px-6 py-4">{group.permission && getPermissionBadge(group.permission.dieuChinhNghiepVu)}</td>
                <td className="px-6 py-4">{group.permission && getPermissionBadge(group.permission.traCuuDiemVaLopHoc)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(group)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.maNhomNguoiDung)}
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
  );
}
