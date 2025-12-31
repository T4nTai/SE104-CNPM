# WEB_PROJECT_2025_2026_UIT

**Giới Thiệu**
- Mục tiêu: Ứng dụng quản lý học sinh/giảng dạy cho môn học trong môn học phần, gồm quản lý người dùng (admin/teacher/student), nhập điểm, xuất báo cáo học kỳ, và phân công lớp/giảng viên.
- Kiến trúc: Frontend bằng React + Vite + TypeScript; Backend bằng Node.js + Express + Sequelize (MySQL); hỗ trợ upload, xuất file Excel/PDF và gửi email.

**Công Cụ Sử Dụng**
- **Runtime:** Node.js (v16+ khuyến nghị).
- **Package manager:** npm (hoặc yarn).
- **Frontend:** Vite, React, TypeScript.
- **Backend:** Express, Sequelize, MySQL (mysql/mysql2), Multer, JWT, Nodemailer.
- **Database:** MySQL (có file sao lưu `Database.sql`).
- **Docker:** Docker + Docker Compose có sẵn cấu hình để chạy toàn bộ hệ thống.

**Cấu Trúc Dự Án**
- **Backend:** [Backend](Backend) — mã nguồn server, model, controller, route.
- **Frontend:** [Frontend](Frontend) — giao diện React + Vite.
- **Tài liệu & SQL:** `Database.sql`, `check_teacher_data.sql`.

**Cài Đặt & Chạy (Local, không dùng Docker)**
1. Sao chép file cấu hình môi trường:

	- Tại thư mục gốc dự án nếu có: sao chép `.env.example` → `.env` và sửa theo môi trường.
	- Tại `Backend`: vào `Backend` và sao chép `.env.example` → `.env` (chỉnh thông tin DB, JWT, email...).

2. Chuẩn bị database:

	- Tạo database MySQL rồi import `Database.sql`:

```powershell
mysql -u <user> -p < Database.sql
```

3. Chạy Backend:

```powershell
cd Backend
npm install
npm run dev   # phát triển với nodemon
# hoặc
npm start     # chạy production (node server.js)
```

4. Chạy Frontend:

```powershell
cd Frontend
npm install
npm run dev   # Vite dev server (mặc định chạy trên http://localhost:5173)
```

5. Mở trình duyệt và truy cập giao diện frontend, sử dụng API tại địa chỉ backend (mặc định trong file cấu hình của frontend).

**Chạy bằng Docker / Docker Compose**
- Nếu muốn chạy toàn bộ bằng Docker (DB + Backend + Frontend), trong thư mục gốc có `docker-compose.yml`. Chạy:

```powershell
docker compose up --build
```

**Biến Môi Trường Quan Trọng**
- Kiểm tra `Backend/.env.example` để biết các biến cần cấu hình (DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, EMAIL_USER, EMAIL_PASS, ...).

**Một số file quan trọng**
- Server entry: [Backend/server.js](Backend/server.js)
- Định nghĩa route: [Backend/src/routes](Backend/src/routes)
- Cấu hình Sequelize: [Backend/src/configs/sequelize.js](Backend/src/configs/sequelize.js)
- Giao diện chính: [Frontend/src/main.tsx](Frontend/src/main.tsx)

**Gợi ý phát triển**
- Để bật chế độ phát triển backend: dùng `npm run dev` trong `Backend`.
- Để test nhanh API, dùng Postman hoặc Insomnia, import route từ `Backend/src/routes` để xem endpoints.

**Ghi chú**
- File mẫu `.env.example` có sẵn; hãy không commit thông tin bí mật vào git.
- Nếu muốn chạy trên Windows và gặp lỗi đường dẫn, kiểm tra quyền đọc/ghi cho thư mục upload (nếu dùng Multer).

**Liên hệ / Người phát triển**
- Nếu cần hỗ trợ thêm, cho mình biết mục bạn muốn mình triển khai (ví dụ: chạy demo bằng Docker, thêm hướng dẫn chi tiết biến môi trường, hay chuẩn hoá scripts). 

