# FE API Integration Guide

This document provides a practical guide for frontend apps to connect to the backend, authenticate, and call role-based APIs. It includes an axios setup, endpoint reference, and usage examples. Where a feature is not yet exposed by the backend, it is marked as "Pending" with suggested endpoints.

---

## Base URL & Environment

- Local (Docker Compose): `http://localhost:4000/api`
- Local (Node without Docker): `http://localhost:3000/api` (if `PORT=3000`)
- Production/Custom: Use your deployment host, e.g. `https://se104.software/api`

Recommended: Configure a single `BASE_URL` env in FE.

```ts
// env.ts
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
```

---

## Axios Setup

```ts
import axios from 'axios';

export const api = axios.create({ baseURL: BASE_URL });

export function setAuthToken(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

export async function login(TenDangNhap: string, MatKhau: string) {
  const { data } = await api.post('/auth/login', { TenDangNhap, MatKhau });
  const token = data?.data?.token as string;
  setAuthToken(token);
  return token;
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
```

Notes:
- JWT is required for protected routes via `Authorization: Bearer <token>`.
- CORS allows `http://localhost:5173` by default in backend; update if your FE runs elsewhere.

---

## Error Shape

```json
{ "message": "...", "details": { /* optional */ } }
```

Handle 401 for missing/expired/invalid tokens; 403 for insufficient role.

---

## Role Overview

- `admin`: manage academic structures, parameters, reports, and (pending) user/groups/permissions.
- `teacher`: manage classes, students, gradebooks; lookup scores and search.
- `student`: view own classes and scores.

Authorization is based on the `role` in JWT (`admin`, `teacher`, `student`).

---

## Auth Endpoints

- POST `/auth/login` → returns `{ token, user }`
- GET `/auth/me` → current user info
- POST `/auth/register-student` → self-register student account (creates `HOCSINH` if needed)
- POST `/auth/register-user` → create `teacher`/`admin` account (requires admin privileges in practice)

Example:
```ts
await login('admin', 'password');
const current = await me();
```

---

## Student Endpoints

- GET `/students/me/classes`
  - Query: `MaHocKy?`
  - Returns enrolled classes with semester averages
- GET `/students/me/scores`
  - Query: `MaHocKy` (required)
  - Returns subject scores per class for that semester

Examples:
```ts
// My classes in semester 1
const classes = await api.get('/students/me/classes', { params: { MaHocKy: 1 } });

// My scores in semester 1
const scores = await api.get('/students/me/scores', { params: { MaHocKy: 1 } });
```

---

## Teacher Endpoints

- GET `/teacher/classes`
  - Query: `MaNamHoc?`, `MaKhoiLop?`
- POST `/teacher/classes/:MaLop/semesters/:MaHocKy/students`
  - Body: `{ MaHocSinh, HoTen, GioiTinh, NgaySinh, ... }`
  - Creates/links student to class for the semester; creates `HOCSINH` if missing
- PUT/PATCH `/teacher/students/:MaHocSinh` → update student
- DELETE `/teacher/students/:MaHocSinh` → delete student (and related joins/grades)
- POST `/teacher/gradebooks/enter`
  - Body: `{ MaLop, MaHocKy, MaMon, scores: [{ MaHocSinh, details: [{ MaLHKT, Lan, Diem }] }] }`
  - Computes weighted subject averages and semester averages
- GET `/teacher/students/:MaHocSinh/scores`
  - Query: `MaHocKy?`
- GET `/teacher/students/search`
  - Query: `q`

Examples:
```ts
// List classes
const { data: cls } = await api.get('/teacher/classes', { params: { MaNamHoc: 2025 } });

// Add student to class/semester
await api.post('/teacher/classes/1/semesters/1/students', {
  MaHocSinh: 'HS1001', HoTen: 'Nguyen Van A', GioiTinh: 'M', NgaySinh: '2009-01-01'
});

// Enter gradebook
await api.post('/teacher/gradebooks/enter', {
  MaLop: 1, MaHocKy: 1, MaMon: 1,
  scores: [
    { MaHocSinh: 'HS1001', details: [{ MaLHKT: 1, Lan: 1, Diem: 8.5 }] },
    { MaHocSinh: 'HS1002', details: [{ MaLHKT: 2, Lan: 1, Diem: 7.0 }] }
  ]
});

// Lookup student scores
const { data: stuScores } = await api.get('/teacher/students/HS1001/scores', { params: { MaHocKy: 1 } });

// Search students
const { data: found } = await api.get('/teacher/students/search', { params: { q: 'Nguyen' } });
```

Feature status:
- Tra cứu danh sách lớp: Available
- Danh sách học sinh: Partially available (via search and by-class enrollments)
- CRUD học sinh: Available (create via add-to-class; update/delete endpoints)
- CRUD bảng điểm: Available (create/update via `enter`; no explicit delete API yet)
- Tra cứu điểm theo lớp môn: Partially available (per-student queries)
- Tra cứu học sinh: Available

---

## Admin Endpoints

- CRUD `KHOILOP`
  - POST `/admin/khoilop` → `{ TenKL, SoLop? }`
  - GET `/admin/khoilop?includeClasses=true|false`
  - PUT/PATCH `/admin/khoilop/:MaKL`
  - DELETE `/admin/khoilop/:MaKL`
- CRUD `MONHOC`
  - POST `/admin/monhoc` → `{ TenMonHoc, HeSoMon, MaMon?, MoTa? }`
  - GET `/admin/monhoc`
  - PUT/PATCH `/admin/monhoc/:MaMonHoc`
  - DELETE `/admin/monhoc/:MaMonHoc`
- CRUD `HOCKY`
  - POST `/admin/hocky` → `{ TenHK, MaNamHoc?, NgayBatDau?, NgayKetThuc? }`
  - GET `/admin/hocky`
  - PUT/PATCH `/admin/hocky/:MaHK`
  - DELETE `/admin/hocky/:MaHK`
- Thay đổi tham số (per year)
  - PUT/PATCH `/admin/namhoc/:MaNH/thamso`
  - Body fields map to `THAMSO`: `diemDatToiThieu`, `diemToiThieuHocKy`, `soHocSinhToiDa1Lop`, `tuoiToiThieu`, `tuoiToiDa`
- Quản lí trọng số kiểm tra (`LOAIHINHKIEMTRA`)
  - POST `/admin/lhkt` → `{ TenLHKT, HeSo }`
  - GET `/admin/lhkt`
  - PUT/PATCH `/admin/lhkt/:MaLHKT`
  - DELETE `/admin/lhkt/:MaLHKT`
- Thêm lớp
  - POST `/admin/lop` → `{ TenLop, MaKhoiLop, MaNamHoc, SiSo? }`

Reports:
- GET `/reports/semester-class` → Query: `MaHocKy`, `MaNamHoc`, `MaLop`
- GET `/reports/subject` → Query: `MaMon`, `MaHocKy`, `MaNamHoc`

Examples:
```ts
// Create grade level
await api.post('/admin/khoilop', { TenKL: '10' });

// Update year parameters
await api.put('/admin/namhoc/2025/thamso', {
  diemDatToiThieu: 5,
  diemToiThieuHocKy: 5,
  soHocSinhToiDa1Lop: 45,
  tuoiToiThieu: 15,
  tuoiToiDa: 20
});

// Report by semester & class
const { data: r1 } = await api.get('/reports/semester-class', {
  params: { MaHocKy: 1, MaNamHoc: 2025, MaLop: 1 }
});

// Report by subject in semester & year
const { data: r2 } = await api.get('/reports/subject', {
  params: { MaMon: 1, MaHocKy: 1, MaNamHoc: 2025 }
});
```

Feature status:
- CRUD `HOCKY`, `MONHOC`, `KHOILOP`: Available
- Thay đổi tham số: Available
- Báo cáo học kỳ theo lớp: Available
- Báo cáo môn học theo lớp và khối: Partially available (subject report by year/semester; class-specific values in `CT_BAOCAOTKMON`)
- CRUD tài khoản giáo viên: Pending (suggested below)
- CRUD nhóm người dùng: Pending
- Quản lí quyền: Pending

---

## Pending Admin Features (Suggested API)

These are not currently implemented in the backend but are aligned with existing models (`NGUOIDUNG`, `NHOMNGUOIDUNG`, `QUYEN`).

Users (teacher/admin accounts):
- POST `/admin/users` → create `{ TenDangNhap, MatKhau, role: 'teacher'|'admin', HoVaTen?, Email? }`
- GET `/admin/users` → list with filters `{ role?, q? }`
- PUT/PATCH `/admin/users/:MaNguoiDung`
- DELETE `/admin/users/:MaNguoiDung`

Groups:
- POST `/admin/groups` → `{ TenNhomNguoiDung, MaQuyen }`
- GET `/admin/groups`
- PUT/PATCH `/admin/groups/:MaNhomNguoiDung`
- DELETE `/admin/groups/:MaNhomNguoiDung`

Permissions:
- POST `/admin/permissions` → `{ PhanQuyenHeThong?, ThayDoiThamSo?, ... }`
- GET `/admin/permissions`
- PUT/PATCH `/admin/permissions/:MaQuyen`
- DELETE `/admin/permissions/:MaQuyen`

If you want, I can add these routes/controllers/services.

---

## FE Role-Based Usage Flow

Admin:
1) Login → set token
2) Setup academic structures (`khoilop`, `hocky`, `monhoc`, `lop`)
3) Configure parameters per year, and `LOAIHINHKIEMTRA`
4) Use reports to validate data
5) (Pending) manage users/groups/permissions

Teacher:
1) Login → set token
2) List classes → enroll students (or create if missing)
3) Enter gradebooks → computed averages
4) Lookup scores and search students

Student:
1) Login → set token
2) View my classes and my semester scores

---

## Tips

- IDs types: `MaHocSinh` is a string in DB; keep consistent in FE.
- Timezone: Asia/Ho_Chi_Minh; dates use `YYYY-MM-DD`.
- Handle nulls in scores/averages gracefully.
- Use Postman collections in `Backend/postman/` for samples.

---

## Quick Test Snippets

```ts
// Admin: create subject and list
await login('admin','password');
await api.post('/admin/monhoc', { TenMonHoc: 'Toán', HeSoMon: 2 });
const monhoc = await api.get('/admin/monhoc');

// Teacher: enter gradebook
await login('teacher','password');
await api.post('/teacher/gradebooks/enter', {
  MaLop: 1, MaHocKy: 1, MaMon: 1,
  scores: [{ MaHocSinh: 'HS1001', details: [{ MaLHKT: 1, Lan: 1, Diem: 9 }]}]
});

// Student: view my scores
await login('student','password');
const meScores = await api.get('/students/me/scores', { params: { MaHocKy: 1 } });
```
