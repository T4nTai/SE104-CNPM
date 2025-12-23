# API Quản Lý Người Dùng

## Mục lục
- [Quản lý Quyền](#quản-lý-quyền)
- [Quản lý Nhóm Người Dùng](#quản-lý-nhóm-người-dùng)
- [Quản lý Người Dùng](#quản-lý-người-dùng)
- [Gửi Email Tự Động](#gửi-email-tự-động)

---

## Quản lý Quyền

### 1. Tạo Quyền Mới
```http
POST /admin/quyen
Content-Type: application/json

{
  "PhanQuyenHeThong": 1,
  "ThayDoiThamSo": 1,
  "ThayDoiQuyDinh": 1,
  "DieuChinhNghiepVu": 1,
  "TraCuuDiemVaLopHoc": 1,
  "TraCuuHocSinh": 1
}
```

**Response:**
```json
{
  "data": {
    "MaQuyen": 1,
    "PhanQuyenHeThong": 1,
    "ThayDoiThamSo": 1,
    "ThayDoiQuyDinh": 1,
    "DieuChinhNghiepVu": 1,
    "TraCuuDiemVaLopHoc": 1,
    "TraCuuHocSinh": 1
  }
}
```

### 2. Lấy Danh Sách Quyền
```http
GET /admin/quyen
```

### 3. Lấy Chi Tiết Một Quyền
```http
GET /admin/quyen/:MaQuyen
```

### 4. Cập Nhật Quyền
```http
PUT /admin/quyen/:MaQuyen
Content-Type: application/json

{
  "PhanQuyenHeThong": 0,
  "ThayDoiThamSo": 1
}
```

### 5. Xóa Quyền
```http
DELETE /admin/quyen/:MaQuyen
```
**Lưu ý:** Không thể xóa quyền nếu đang có nhóm người dùng sử dụng.

---

## Quản lý Nhóm Người Dùng

### 1. Tạo Nhóm Người Dùng Mới
```http
POST /admin/nhomnguoidung
Content-Type: application/json

{
  "TenNhomNguoiDung": "Giáo viên",
  "MaQuyen": 1
}
```

**Response:**
```json
{
  "data": {
    "MaNhomNguoiDung": 1,
    "TenNhomNguoiDung": "Giáo viên",
    "MaQuyen": 1
  }
}
```

### 2. Lấy Danh Sách Nhóm
```http
GET /admin/nhomnguoidung
```

**Response:** Bao gồm thông tin quyền của nhóm
```json
{
  "data": [
    {
      "MaNhomNguoiDung": 1,
      "TenNhomNguoiDung": "Giáo viên",
      "MaQuyen": 1,
      "quyen": {
        "MaQuyen": 1,
        "PhanQuyenHeThong": 0,
        "ThayDoiThamSo": 1,
        ...
      }
    }
  ]
}
```

### 3. Lấy Chi Tiết Một Nhóm
```http
GET /admin/nhomnguoidung/:MaNhom
```

### 4. Cập Nhật Nhóm
```http
PUT /admin/nhomnguoidung/:MaNhom
Content-Type: application/json

{
  "TenNhomNguoiDung": "Giáo viên chủ nhiệm",
  "MaQuyen": 2
}
```

### 5. Xóa Nhóm
```http
DELETE /admin/nhomnguoidung/:MaNhom
```
**Lưu ý:** Không thể xóa nhóm nếu đang có người dùng thuộc nhóm.

---

## Quản lý Người Dùng

### 1. Tạo Người Dùng Mới
```http
POST /admin/nguoidung
Content-Type: application/json

{
  "TenDangNhap": "giaovien01",
  "MatKhau": "password123",
  "HoVaTen": "Nguyễn Văn A",
  "Email": "nguyenvana@example.com",
  "MaNhomNguoiDung": 1,
  "MaHocSinh": null,
  "sendEmail": true
}
```

**Tham số:**
- `TenDangNhap` (bắt buộc): Tên đăng nhập duy nhất
- `MatKhau` (bắt buộc): Mật khẩu (sẽ được hash tự động)
- `HoVaTen`: Họ và tên người dùng
- `Email`: Email để nhận thông tin đăng nhập
- `MaNhomNguoiDung` (bắt buộc): ID nhóm người dùng
- `MaHocSinh`: ID học sinh (nếu là tài khoản học sinh)
- `sendEmail` (mặc định: true): Có gửi email thông tin đăng nhập hay không

**Response:**
```json
{
  "data": {
    "MaNguoiDung": 1,
    "TenDangNhap": "giaovien01",
    "HoVaTen": "Nguyễn Văn A",
    "Email": "nguyenvana@example.com",
    "MaNhomNguoiDung": 1,
    "MaHocSinh": null
  }
}
```

**Lưu ý:**
- Mật khẩu sẽ được hash bằng bcryptjs trước khi lưu
- Nếu có email và `sendEmail=true`, hệ thống sẽ tự động gửi thông tin đăng nhập qua email
- Việc gửi email thất bại sẽ không làm hủy bỏ việc tạo tài khoản

### 2. Lấy Danh Sách Người Dùng
```http
GET /admin/nguoidung

# Lọc theo nhóm người dùng
GET /admin/nguoidung?MaNhomNguoiDung=1
```

**Response:** Bao gồm thông tin nhóm, quyền và học sinh (nếu có)
```json
{
  "data": [
    {
      "MaNguoiDung": 1,
      "TenDangNhap": "giaovien01",
      "HoVaTen": "Nguyễn Văn A",
      "Email": "nguyenvana@example.com",
      "MaNhomNguoiDung": 1,
      "MaHocSinh": null,
      "nhom": {
        "MaNhomNguoiDung": 1,
        "TenNhomNguoiDung": "Giáo viên",
        "quyen": { ... }
      },
      "hocSinh": null
    }
  ]
}
```

**Lưu ý:** Mật khẩu không được trả về trong response

### 3. Lấy Chi Tiết Một Người Dùng
```http
GET /admin/nguoidung/:MaNguoiDung
```

### 4. Cập Nhật Người Dùng
```http
PUT /admin/nguoidung/:MaNguoiDung
Content-Type: application/json

{
  "TenDangNhap": "giaovien01_updated",
  "HoVaTen": "Nguyễn Văn A Updated",
  "Email": "newemail@example.com",
  "MatKhau": "newpassword123",
  "MaNhomNguoiDung": 2,
  "MaHocSinh": "HS001"
}
```

**Lưu ý:**
- Nếu thay đổi `TenDangNhap`, hệ thống sẽ kiểm tra trùng lặp
- Nếu có `MatKhau` mới, sẽ được hash tự động
- Chỉ cập nhật các trường được cung cấp

### 5. Xóa Người Dùng
```http
DELETE /admin/nguoidung/:MaNguoiDung
```

### 6. Reset Mật Khẩu
```http
POST /admin/nguoidung/:MaNguoiDung/reset-password
Content-Type: application/json

{
  "MatKhauMoi": "newpassword123"
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "message": "Mật khẩu đã được đặt lại"
  }
}
```

---

## Gửi Email Tự Động

### Cấu hình Email

Cần thiết lập các biến môi trường trong file `.env`:

```env
# Email configuration
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_PASSWORD=your-app-password
WEBSITE_URL=http://localhost:3000
SUPPORT_EMAIL=support@school.edu
SUPPORT_PHONE=0123456789
```

### Cách lấy App Password cho Gmail:
1. Đăng nhập vào tài khoản Gmail
2. Vào "Quản lý tài khoản Google" → "Bảo mật"
3. Bật "Xác minh 2 bước" nếu chưa có
4. Tìm "Mật khẩu ứng dụng" và tạo mật khẩu mới cho "Mail"
5. Sao chép mật khẩu 16 ký tự vào `NODEMAILER_PASSWORD`

### Nội dung Email

Khi tạo tài khoản mới, người dùng sẽ nhận được email với:
- Thông tin đăng nhập (username và mật khẩu)
- Link website đăng nhập (nếu có cấu hình)
- Thông tin liên hệ hỗ trợ
- Lưu ý đổi mật khẩu ngay lần đầu đăng nhập

### Tắt gửi Email

Nếu không muốn gửi email khi tạo tài khoản:
```json
{
  "TenDangNhap": "user01",
  "MatKhau": "password123",
  ...
  "sendEmail": false
}
```

---

## Ví dụ Workflow

### 1. Tạo Quyền cho Giáo Viên
```bash
curl -X POST http://localhost:3000/admin/quyen \
  -H "Content-Type: application/json" \
  -d '{
    "PhanQuyenHeThong": 0,
    "ThayDoiThamSo": 0,
    "ThayDoiQuyDinh": 0,
    "DieuChinhNghiepVu": 1,
    "TraCuuDiemVaLopHoc": 1,
    "TraCuuHocSinh": 1
  }'
```

### 2. Tạo Nhóm Giáo Viên
```bash
curl -X POST http://localhost:3000/admin/nhomnguoidung \
  -H "Content-Type: application/json" \
  -d '{
    "TenNhomNguoiDung": "Giáo viên",
    "MaQuyen": 1
  }'
```

### 3. Tạo Tài Khoản Giáo Viên (có gửi email)
```bash
curl -X POST http://localhost:3000/admin/nguoidung \
  -H "Content-Type: application/json" \
  -d '{
    "TenDangNhap": "gv.nguyenvana",
    "MatKhau": "GV@2024",
    "HoVaTen": "Nguyễn Văn A",
    "Email": "nguyenvana@school.edu",
    "MaNhomNguoiDung": 1,
    "sendEmail": true
  }'
```

### 4. Tạo Tài Khoản Học Sinh (liên kết với học sinh)
```bash
curl -X POST http://localhost:3000/admin/nguoidung \
  -H "Content-Type: application/json" \
  -d '{
    "TenDangNhap": "hs.nguyenvanb",
    "MatKhau": "HS@2024",
    "HoVaTen": "Nguyễn Văn B",
    "Email": "nguyenvanb@student.edu",
    "MaNhomNguoiDung": 2,
    "MaHocSinh": "HS001",
    "sendEmail": true
  }'
```

---

## Error Codes

| HTTP Code | Mã lỗi | Mô tả |
|-----------|--------|-------|
| 400 | Bad Request | Thiếu dữ liệu bắt buộc hoặc dữ liệu không hợp lệ |
| 404 | Not Found | Không tìm thấy bản ghi |
| 409 | Conflict | Tên đăng nhập đã tồn tại |
| 500 | Internal Error | Lỗi server |

---

## Bảo mật

- Mật khẩu được hash bằng bcryptjs với salt rounds = 10
- Mật khẩu không bao giờ được trả về trong response API
- Kiểm tra tên đăng nhập trùng lặp
- Kiểm tra tính hợp lệ của foreign keys trước khi tạo/cập nhật

---

## Testing

Sử dụng Postman collection có sẵn:
- Import file: `Backend/postman/nmcnpm.postman_collection.json`
- Import environment: `Backend/postman/nmcnpm.postman_environment.json`
