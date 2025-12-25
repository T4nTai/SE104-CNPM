import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const AdminRoute = Router();

// Tất cả routes của admin cần JWT authentication
AdminRoute.use(authenticateJWT);

// ===== Nam Hoc (Academic Years) =====
AdminRoute.get("/namhoc", AdminController.listNamHoc);
AdminRoute.post("/namhoc", AdminController.createNamHoc);
AdminRoute.delete("/namhoc/:MaNH", AdminController.deleteNamHoc);

// ===== Khoi Lop =====
AdminRoute.post("/khoilop", AdminController.createKhoiLop);
AdminRoute.get("/khoilop", AdminController.listKhoiLop);
AdminRoute.put("/khoilop/:MaKL", AdminController.updateKhoiLop);
AdminRoute.patch("/khoilop/:MaKL", AdminController.updateKhoiLop);
AdminRoute.delete("/khoilop/:MaKL", AdminController.deleteKhoiLop);

// ===== Mon Hoc =====
AdminRoute.post("/monhoc", AdminController.createMonHoc);
AdminRoute.get("/monhoc", AdminController.listMonHoc);
AdminRoute.put("/monhoc/:MaMonHoc", AdminController.updateMonHoc);
AdminRoute.patch("/monhoc/:MaMonHoc", AdminController.updateMonHoc);
AdminRoute.delete("/monhoc/:MaMonHoc", AdminController.deleteMonHoc);

// ===== Hoc Ky =====
AdminRoute.post("/hocky", AdminController.createHocKy);
AdminRoute.get("/hocky", AdminController.listHocKy); // hỗ trợ query ?NamHoc=2024-2025 hoặc ?MaNamHoc=1
AdminRoute.put("/hocky/:MaHK", AdminController.updateHocKy);
AdminRoute.patch("/hocky/:MaHK", AdminController.updateHocKy);
AdminRoute.delete("/hocky/:MaHK", AdminController.deleteHocKy);

// ===== Loai Hinh Kiem Tra =====
AdminRoute.post("/lhkt", AdminController.createLoaiHinhKiemTra);
AdminRoute.get("/lhkt", AdminController.listLoaiHinhKiemTra);
AdminRoute.put("/lhkt/:MaLHKT", AdminController.updateLoaiHinhKiemTra);
AdminRoute.patch("/lhkt/:MaLHKT", AdminController.updateLoaiHinhKiemTra);
AdminRoute.delete("/lhkt/:MaLHKT", AdminController.deleteLoaiHinhKiemTra);

// ===== ThamSo (CRUD theo NamHoc) =====

// list tất cả tham số (optional filter: ?MaNamHoc=1)
AdminRoute.get("/thamso", AdminController.listThamSo);

// CRUD theo năm học
AdminRoute.post("/namhoc/:MaNH/thamso", AdminController.createThamSo);
AdminRoute.get("/namhoc/:MaNH/thamso", AdminController.getThamSoByNamHoc);
AdminRoute.put("/namhoc/:MaNH/thamso", AdminController.updateThamSoByNamHoc);
AdminRoute.patch("/namhoc/:MaNH/thamso", AdminController.updateThamSoByNamHoc);
AdminRoute.delete("/namhoc/:MaNH/thamso", AdminController.deleteThamSoByNamHoc);

// upsert riêng (để không “đánh đồng” PUT = upsert)
AdminRoute.put("/namhoc/:MaNH/thamso/upsert", AdminController.upsertThamSo);
AdminRoute.patch("/namhoc/:MaNH/thamso/upsert", AdminController.upsertThamSo);

// ===== Them lop =====
AdminRoute.post("/lop", AdminController.createLop);
AdminRoute.get("/lop", AdminController.listLop);
AdminRoute.delete("/lop/:MaLop", AdminController.deleteLop);
// Phân công giáo viên chủ nhiệm
AdminRoute.put("/lop/:MaLop/assign-homeroom", AdminController.assignHomeroom);
AdminRoute.patch("/lop/:MaLop/assign-homeroom", AdminController.assignHomeroom);

// ===== Quyen (Permissions) =====
AdminRoute.post("/quyen", AdminController.createQuyen);
AdminRoute.get("/quyen", AdminController.listQuyen);
AdminRoute.get("/quyen/:MaQuyen", AdminController.getQuyen);
AdminRoute.put("/quyen/:MaQuyen", AdminController.updateQuyen);
AdminRoute.patch("/quyen/:MaQuyen", AdminController.updateQuyen);
AdminRoute.delete("/quyen/:MaQuyen", AdminController.deleteQuyen);

// ===== Nhom Nguoi Dung (User Groups) =====
AdminRoute.post("/nhomnguoidung", AdminController.createNhomNguoiDung);
AdminRoute.get("/nhomnguoidung", AdminController.listNhomNguoiDung);
AdminRoute.get("/nhomnguoidung/:MaNhom", AdminController.getNhomNguoiDung);
AdminRoute.put("/nhomnguoidung/:MaNhom", AdminController.updateNhomNguoiDung);
AdminRoute.patch("/nhomnguoidung/:MaNhom", AdminController.updateNhomNguoiDung);
AdminRoute.delete("/nhomnguoidung/:MaNhom", AdminController.deleteNhomNguoiDung);

// ===== Nguoi Dung (Users) =====
AdminRoute.post("/nguoidung", AdminController.createNguoiDung);
AdminRoute.get("/nguoidung", AdminController.listNguoiDung); // hỗ trợ query ?MaNhomNguoiDung=1
AdminRoute.get("/nguoidung/:MaNguoiDung", AdminController.getNguoiDung);
AdminRoute.put("/nguoidung/:MaNguoiDung", AdminController.updateNguoiDung);
AdminRoute.patch("/nguoidung/:MaNguoiDung", AdminController.updateNguoiDung);
AdminRoute.delete("/nguoidung/:MaNguoiDung", AdminController.deleteNguoiDung);
AdminRoute.post("/nguoidung/:MaNguoiDung/reset-password", AdminController.resetMatKhau);
AdminRoute.post("/nguoidung/import", upload.single("file"), AdminController.importNguoiDung);

// Phân công giáo viên bộ môn cho Bảng điểm môn (theo lớp-môn-học kỳ)
AdminRoute.put("/gradebooks/assign-teacher", AdminController.assignSubjectTeacher);
AdminRoute.post("/gradebooks/assign-teacher", AdminController.assignSubjectTeacher);

// ===== Quản lý phân công giáo viên =====
AdminRoute.get("/class-assignments", AdminController.listClassAssignments);
AdminRoute.delete("/class-assignments/homeroom/:MaLop", AdminController.removeHomeroomTeacher);
AdminRoute.delete("/class-assignments/subject/:MaBangDiemMon", AdminController.removeSubjectTeacher);

export default AdminRoute;
