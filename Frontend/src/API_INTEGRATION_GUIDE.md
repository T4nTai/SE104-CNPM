# Hướng dẫn tích hợp API cho hệ thống quản lý học sinh

## Cấu trúc Database

### Bảng NGUOIDUNG (Người dùng)
```sql
- MaNguoiDung (int, PK, Auto-increment)
- TenDangNhap (varchar)
- MatKhau (varchar)
- HoVaTen (varchar)
- Email (varchar)
- MaNhomNguoiDung (int, FK -> NHOMNGUOIDUNG)
```

### Bảng NHOMNGUOIDUNG (Nhóm người dùng)
```sql
- MaNhomNguoiDung (int, PK, Auto-increment)
- TenNhomNguoiDung (varchar)
- MaQuyen (int, FK -> QUYEN)
```

### Bảng QUYEN (Quyền)
```sql
- MaQuyen (int, PK, Auto-increment)
- PhanQuyenHeThong (int) - 0 hoặc 1
- ThayDoiThamSo (int) - 0 hoặc 1
- ThayDoiQuyDinh (int) - 0 hoặc 1
- DieuChinhNghiepVu (int) - 0 hoặc 1
- TraCuuDiemVaLopHoc (int) - 0 hoặc 1
- TraCuuHocSinh (int) - 0 hoặc 1
```

## API Endpoints cần xây dựng

### 1. QUẢN LÝ NGƯỜI DÙNG

#### GET /api/users
Lấy danh sách tất cả người dùng
```typescript
// Response
[
  {
    maNguoiDung: number,
    tenDangNhap: string,
    matKhau: string,
    hoVaTen: string,
    email: string,
    maNhomNguoiDung: number,
    tenNhomNguoiDung?: string
  }
]
```

**File cần cập nhật:** `/components/admin/UserManagement.tsx`
- Dòng 57-63: Hàm `fetchUsers()`

#### POST /api/users
Tạo người dùng mới
```typescript
// Request body
{
  tenDangNhap: string,
  matKhau: string,
  hoVaTen: string,
  email: string,
  maNhomNguoiDung: number
}

// Response
{
  maNguoiDung: number,
  tenDangNhap: string,
  matKhau: string,
  hoVaTen: string,
  email: string,
  maNhomNguoiDung: number,
  tenNhomNguoiDung?: string
}
```

**File cần cập nhật:** `/components/admin/UserManagement.tsx`
- Dòng 84-91: Phần POST trong hàm `handleSubmit()`

#### PUT /api/users/:id
Cập nhật thông tin người dùng
```typescript
// Request body
{
  tenDangNhap: string,
  matKhau: string,
  hoVaTen: string,
  email: string,
  maNhomNguoiDung: number
}

// Response
{
  success: boolean,
  message: string
}
```

**File cần cập nhật:** `/components/admin/UserManagement.tsx`
- Dòng 76-82: Phần PUT trong hàm `handleSubmit()`

#### DELETE /api/users/:id
Xóa người dùng
```typescript
// Response
{
  success: boolean,
  message: string
}
```

**File cần cập nhật:** `/components/admin/UserManagement.tsx`
- Dòng 130-134: Hàm `handleDelete()`

---

### 2. QUẢN LÝ NHÓM NGƯỜI DÙNG

#### GET /api/user-groups
Lấy danh sách nhóm người dùng kèm quyền
```typescript
// Response
[
  {
    maNhomNguoiDung: number,
    tenNhomNguoiDung: string,
    maQuyen: number,
    permission?: {
      maQuyen: number,
      phanQuyenHeThong: number,
      thayDoiThamSo: number,
      thayDoiQuyDinh: number,
      dieuChinhNghiepVu: number,
      traCuuDiemVaLopHoc: number,
      traCuuHocSinh: number
    }
  }
]
```

**File cần cập nhật:** `/components/admin/UserGroupManagement.tsx`
- Dòng 43-51: Hàm `fetchUserGroups()`

#### POST /api/user-groups
Tạo nhóm người dùng mới
```typescript
// Request body
{
  tenNhomNguoiDung: string,
  maQuyen: number
}

// Response
{
  maNhomNguoiDung: number,
  tenNhomNguoiDung: string,
  maQuyen: number
}
```

**File cần cập nhật:** `/components/admin/UserGroupManagement.tsx`
- Dòng 73-80: Phần POST trong hàm `handleSubmit()`

#### PUT /api/user-groups/:id
Cập nhật nhóm người dùng
```typescript
// Request body
{
  tenNhomNguoiDung: string,
  maQuyen: number
}

// Response
{
  success: boolean,
  message: string
}
```

**File cần cập nhật:** `/components/admin/UserGroupManagement.tsx`
- Dòng 62-71: Phần PUT trong hàm `handleSubmit()`

#### DELETE /api/user-groups/:id
Xóa nhóm người dùng
```typescript
// Response
{
  success: boolean,
  message: string
}
```

**File cần cập nhật:** `/components/admin/UserGroupManagement.tsx`
- Dòng 103-107: Hàm `handleDelete()`

---

### 3. QUẢN LÝ QUYỀN

#### GET /api/permissions
Lấy danh sách tất cả quyền
```typescript
// Response
[
  {
    maQuyen: number,
    phanQuyenHeThong: number,
    thayDoiThamSo: number,
    thayDoiQuyDinh: number,
    dieuChinhNghiepVu: number,
    traCuuDiemVaLopHoc: number,
    traCuuHocSinh: number
  }
]
```

**File cần cập nhật:** `/components/admin/PermissionManagement.tsx`
- Dòng 49-55: Hàm `fetchPermissions()`

#### POST /api/permissions
Tạo quyền mới
```typescript
// Request body
{
  phanQuyenHeThong: number, // 0 hoặc 1
  thayDoiThamSo: number,
  thayDoiQuyDinh: number,
  dieuChinhNghiepVu: number,
  traCuuDiemVaLopHoc: number,
  traCuuHocSinh: number
}

// Response
{
  maQuyen: number,
  phanQuyenHeThong: number,
  thayDoiThamSo: number,
  thayDoiQuyDinh: number,
  dieuChinhNghiepVu: number,
  traCuuDiemVaLopHoc: number,
  traCuuHocSinh: number
}
```

**File cần cập nhật:** `/components/admin/PermissionManagement.tsx`
- Dòng 70-78: Phần POST trong hàm `handleSubmit()`

#### PUT /api/permissions/:id
Cập nhật quyền
```typescript
// Request body
{
  phanQuyenHeThong: number,
  thayDoiThamSo: number,
  thayDoiQuyDinh: number,
  dieuChinhNghiepVu: number,
  traCuuDiemVaLopHoc: number,
  traCuuHocSinh: number
}

// Response
{
  success: boolean,
  message: string
}
```

**File cần cập nhật:** `/components/admin/PermissionManagement.tsx`
- Dòng 61-68: Phần PUT trong hàm `handleSubmit()`

#### DELETE /api/permissions/:id
Xóa quyền
```typescript
// Response
{
  success: boolean,
  message: string
}
```

**File cần cập nhật:** `/components/admin/PermissionManagement.tsx`
- Dòng 100-104: Hàm `handleDelete()`

---

## Cách tích hợp API

### Bước 1: Tạo file API service

Tạo file `/services/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export async function apiGet(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Thêm token nếu cần
      // 'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function apiPost(endpoint: string, data: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function apiPut(endpoint: string, data: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function apiDelete(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}
```

### Bước 2: Cập nhật các component

Trong mỗi component, thay thế code mock bằng API calls:

**Ví dụ trong UserManagement.tsx:**

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api';

const fetchUsers = async () => {
  try {
    const data = await apiGet('/users');
    setUsers(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    alert('Không thể tải danh sách người dùng');
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    if (editingId) {
      await apiPut(`/users/${editingId}`, formData);
      await fetchUsers(); // Reload data
    } else {
      const newUser = await apiPost('/users', formData);
      setUsers([...users, newUser]);
    }
    resetForm();
  } catch (error) {
    console.error('Error saving user:', error);
    alert('Không thể lưu người dùng');
  }
};
```

### Bước 3: Cấu hình biến môi trường

Tạo file `.env`:
```
REACT_APP_API_URL=http://localhost:3000/api
```

---

## Lưu ý quan trọng

1. **Xác thực (Authentication):**
   - Thêm JWT token vào header khi gọi API
   - Lưu token trong localStorage hoặc sessionStorage

2. **Xử lý lỗi:**
   - Thêm try-catch cho tất cả API calls
   - Hiển thị thông báo lỗi thân thiện cho người dùng

3. **Loading states:**
   - Thêm state loading khi gọi API
   - Hiển thị spinner hoặc skeleton loading

4. **Validation:**
   - Validate dữ liệu ở cả frontend và backend
   - Đảm bảo các giá trị quyền chỉ là 0 hoặc 1

5. **Security:**
   - Mã hóa mật khẩu trước khi gửi lên server
   - Kiểm tra quyền truy cập ở cả frontend và backend

---

## Checklist tích hợp API

- [ ] Tạo backend API với các endpoints đã liệt kê
- [ ] Tạo file `/services/api.ts`
- [ ] Cập nhật UserManagement.tsx
- [ ] Cập nhật UserGroupManagement.tsx
- [ ] Cập nhật PermissionManagement.tsx
- [ ] Thêm xác thực JWT
- [ ] Thêm xử lý lỗi
- [ ] Thêm loading states
- [ ] Test tất cả chức năng CRUD
- [ ] Deploy và kiểm tra trên production
