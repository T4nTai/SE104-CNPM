import { AdminService } from "../services/admin.service.js";
import { parseSpreadsheet } from "../ultis/spreadsheet.js";

export class AdminController {
  // ===== NAM HOC =====
  static async listNamHoc(req, res, next) {
    try {
      const rows = await AdminService.listNamHoc();
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async createNamHoc(req, res, next) {
    try {
      const row = await AdminService.createNamHoc(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  // ===== KHOI LOP =====
  static async createKhoiLop(req, res, next) {
    try {
      const row = await AdminService.createKhoiLop(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async listKhoiLop(req, res, next) {
    try {
      const includeClasses = String(req.query.includeClasses || "false") === "true";
      const rows = await AdminService.listKhoiLop({ includeClasses });
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async updateKhoiLop(req, res, next) {
    try {
      const id = Number(req.params.MaKL);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaKL không hợp lệ" };

      const row = await AdminService.updateKhoiLop(id, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async deleteKhoiLop(req, res, next) {
    try {
      const id = Number(req.params.MaKL);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaKL không hợp lệ" };

      const result = await AdminService.deleteKhoiLop(id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // ===== MON HOC =====
  static async createMonHoc(req, res, next) {
    try {
      const row = await AdminService.createMonHoc(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async listMonHoc(req, res, next) {
    try {
      const rows = await AdminService.listMonHoc();
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async updateMonHoc(req, res, next) {
    try {
      const id = Number(req.params.MaMonHoc);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaMonHoc không hợp lệ" };

      const row = await AdminService.updateMonHoc(id, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async deleteMonHoc(req, res, next) {
    try {
      const id = Number(req.params.MaMonHoc);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaMonHoc không hợp lệ" };

      const result = await AdminService.deleteMonHoc(id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // ===== HOC KY =====
  static async createHocKy(req, res, next) {
    try {
      const row = await AdminService.createHocKy(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async listHocKy(req, res, next) {
    try {
      const rows = await AdminService.listHocKy();
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async updateHocKy(req, res, next) {
    try {
      const id = Number(req.params.MaHK);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaHK không hợp lệ" };

      const row = await AdminService.updateHocKy(id, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async deleteHocKy(req, res, next) {
    try {
      const id = Number(req.params.MaHK);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaHK không hợp lệ" };

      const result = await AdminService.deleteHocKy(id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // ===== LOAI HINH KIEM TRA =====
  static async createLoaiHinhKiemTra(req, res, next) {
    try {
      const row = await AdminService.createLoaiHinhKiemTra(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async listLoaiHinhKiemTra(req, res, next) {
    try {
      const rows = await AdminService.listLoaiHinhKiemTra();
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async updateLoaiHinhKiemTra(req, res, next) {
    try {
      const id = Number(req.params.MaLHKT);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaLHKT không hợp lệ" };

      const row = await AdminService.updateLoaiHinhKiemTra(id, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async deleteLoaiHinhKiemTra(req, res, next) {
    try {
      const id = Number(req.params.MaLHKT);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaLHKT không hợp lệ" };

      const result = await AdminService.deleteLoaiHinhKiemTra(id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // ===== THAM SO (CRUD theo NAM HOC) =====

  // POST /admin/namhoc/:MaNH/thamso
  static async createThamSo(req, res, next) {
    try {
      const MaNamHoc = Number(req.params.MaNH);
      if (!Number.isInteger(MaNamHoc)) throw { status: 400, message: "MaNH không hợp lệ" };

      const row = await AdminService.createThamSo({ MaNamHoc, ...req.body });
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  // GET /admin/thamso?MaNamHoc=1
  static async listThamSo(req, res, next) {
    try {
      const MaNamHoc = req.query.MaNamHoc != null ? Number(req.query.MaNamHoc) : null;
      if (req.query.MaNamHoc != null && !Number.isInteger(MaNamHoc)) {
        throw { status: 400, message: "MaNamHoc không hợp lệ" };
      }

      const rows = await AdminService.listThamSo({ MaNamHoc });
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  // GET /admin/namhoc/:MaNH/thamso
  static async getThamSoByNamHoc(req, res, next) {
    try {
      const MaNamHoc = Number(req.params.MaNH);
      if (!Number.isInteger(MaNamHoc)) throw { status: 400, message: "MaNH không hợp lệ" };

      const row = await AdminService.getThamSoByNamHoc(MaNamHoc);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  // PUT /admin/namhoc/:MaNH/thamso
  static async updateThamSoByNamHoc(req, res, next) {
    try {
      const MaNamHoc = Number(req.params.MaNH);
      if (!Number.isInteger(MaNamHoc)) throw { status: 400, message: "MaNH không hợp lệ" };

      const row = await AdminService.updateThamSoByNamHoc(MaNamHoc, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  // DELETE /admin/namhoc/:MaNH/thamso
  static async deleteThamSoByNamHoc(req, res, next) {
    try {
      const MaNamHoc = Number(req.params.MaNH);
      if (!Number.isInteger(MaNamHoc)) throw { status: 400, message: "MaNH không hợp lệ" };

      const result = await AdminService.deleteThamSoByNamHoc(MaNamHoc);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // UPSERT: PUT /admin/namhoc/:MaNH/thamso/upsert (hoặc route bạn đang dùng)
  static async upsertThamSo(req, res, next) {
    try {
      const MaNamHoc = Number(req.params.MaNH);
      if (!Number.isInteger(MaNamHoc)) throw { status: 400, message: "MaNH không hợp lệ" };

      const row = await AdminService.upsertThamSoByNamHoc(MaNamHoc, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  // ===== THEM LOP =====
  static async createLop(req, res, next) {
    try {
      const row = await AdminService.createLop(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async listLop(req, res, next) {
    try {
      const MaNamHoc = req.query.MaNamHoc ? Number(req.query.MaNamHoc) : null;
      const MaKhoiLop = req.query.MaKhoiLop ? Number(req.query.MaKhoiLop) : null;
      const rows = await AdminService.listLop({ MaNamHoc, MaKhoiLop });
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async deleteLop(req, res, next) {
    try {
      const id = Number(req.params.MaLop);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaLop không hợp lệ" };
      const result = await AdminService.deleteLop(id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // ===== PHÂN CÔNG GVCN CHO LỚP =====
  static async assignHomeroom(req, res, next) {
    try {
      const MaLop = Number(req.params.MaLop);
      if (!Number.isInteger(MaLop)) throw { status: 400, message: "MaLop không hợp lệ" };
      const row = await AdminService.assignHomeroomTeacher(MaLop, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  // ===== QUYEN (PERMISSIONS) =====
  static async createQuyen(req, res, next) {
    try {
      const row = await AdminService.createQuyen(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async listQuyen(req, res, next) {
    try {
      const rows = await AdminService.listQuyen();
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async getQuyen(req, res, next) {
    try {
      const id = Number(req.params.MaQuyen);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaQuyen không hợp lệ" };
      const row = await AdminService.getQuyen(id);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async updateQuyen(req, res, next) {
    try {
      const id = Number(req.params.MaQuyen);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaQuyen không hợp lệ" };
      const row = await AdminService.updateQuyen(id, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async deleteQuyen(req, res, next) {
    try {
      const id = Number(req.params.MaQuyen);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaQuyen không hợp lệ" };
      const result = await AdminService.deleteQuyen(id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // ===== NHOM NGUOI DUNG (USER GROUPS) =====
  static async createNhomNguoiDung(req, res, next) {
    try {
      const row = await AdminService.createNhomNguoiDung(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async listNhomNguoiDung(req, res, next) {
    try {
      const rows = await AdminService.listNhomNguoiDung();
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async getNhomNguoiDung(req, res, next) {
    try {
      const id = Number(req.params.MaNhom);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaNhom không hợp lệ" };
      const row = await AdminService.getNhomNguoiDung(id);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async updateNhomNguoiDung(req, res, next) {
    try {
      const id = Number(req.params.MaNhom);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaNhom không hợp lệ" };
      const row = await AdminService.updateNhomNguoiDung(id, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async deleteNhomNguoiDung(req, res, next) {
    try {
      const id = Number(req.params.MaNhom);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaNhom không hợp lệ" };
      const result = await AdminService.deleteNhomNguoiDung(id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // ===== NGUOI DUNG (USERS) =====
  static async createNguoiDung(req, res, next) {
    try {
      const row = await AdminService.createNguoiDung(req.body);
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async listNguoiDung(req, res, next) {
    try {
      const MaNhomNguoiDung = req.query.MaNhomNguoiDung != null ? Number(req.query.MaNhomNguoiDung) : null;
      if (req.query.MaNhomNguoiDung != null && !Number.isInteger(MaNhomNguoiDung)) {
        throw { status: 400, message: "MaNhomNguoiDung không hợp lệ" };
      }
      const rows = await AdminService.listNguoiDung({ MaNhomNguoiDung });
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async getNguoiDung(req, res, next) {
    try {
      const id = Number(req.params.MaNguoiDung);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaNguoiDung không hợp lệ" };
      const row = await AdminService.getNguoiDung(id);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async updateNguoiDung(req, res, next) {
    try {
      const id = Number(req.params.MaNguoiDung);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaNguoiDung không hợp lệ" };
      const row = await AdminService.updateNguoiDung(id, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async deleteNguoiDung(req, res, next) {
    try {
      const id = Number(req.params.MaNguoiDung);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaNguoiDung không hợp lệ" };
      const result = await AdminService.deleteNguoiDung(id);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async resetMatKhau(req, res, next) {
    try {
      const id = Number(req.params.MaNguoiDung);
      if (!Number.isInteger(id)) throw { status: 400, message: "MaNguoiDung không hợp lệ" };
      const result = await AdminService.resetMatKhau(id, req.body);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async importNguoiDung(req, res, next) {
    try {
      if (!req.file) throw { status: 400, message: "Vui lòng chọn file CSV/XLSX" };
      const rows = parseSpreadsheet(req.file.buffer);
      const result = await AdminService.importNguoiDungFromRows(rows);
      res.status(201).json({ data: result });
    } catch (e) { next(e); }
  }

  // ===== PHÂN CÔNG GV BỘ MÔN CHO BẢNG ĐIỂM MÔN =====
  static async assignSubjectTeacher(req, res, next) {
    try {
      const payload = {
        MaLop: req.body.MaLop != null ? Number(req.body.MaLop) : null,
        MaMon: req.body.MaMon != null ? Number(req.body.MaMon) : null,
        MaHocKy: req.body.MaHocKy != null ? Number(req.body.MaHocKy) : null,
        MaGV: req.body.MaGV != null ? Number(req.body.MaGV) : null,
      };
      const row = await AdminService.assignSubjectTeacher(payload);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  // ===== QUẢN LÝ PHÂN CÔNG GIÁO VIÊN =====
  static async listClassAssignments(req, res, next) {
    try {
      const rows = await AdminService.listClassAssignments({
        MaNamHoc: req.query.MaNamHoc ? Number(req.query.MaNamHoc) : null,
        MaKhoiLop: req.query.MaKhoiLop ? Number(req.query.MaKhoiLop) : null,
      });
      res.json({ data: rows });
    } catch (e) { next(e); }
  }

  static async removeHomeroomTeacher(req, res, next) {
    try {
      const MaLop = Number(req.params.MaLop);
      if (!Number.isInteger(MaLop)) throw { status: 400, message: "MaLop không hợp lệ" };
      const result = await AdminService.removeHomeroomTeacher(MaLop);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async removeSubjectTeacher(req, res, next) {
    try {
      const MaBangDiemMon = Number(req.params.MaBangDiemMon);
      if (!Number.isInteger(MaBangDiemMon)) throw { status: 400, message: "MaBangDiemMon không hợp lệ" };
      const result = await AdminService.removeSubjectTeacher(MaBangDiemMon);
      res.json({ data: result });
    } catch (e) { next(e); }
  }
}
