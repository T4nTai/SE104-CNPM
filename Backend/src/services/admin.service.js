import { Op } from "sequelize";
import { KhoiLop, MonHoc, HocKy, NamHoc, LoaiHinhKiemTra } from "../models/academic.model.js";
import { Lop, HocSinh, HocSinhLop } from "../models/student.model.js";
import { BangDiemMon } from "../models/gradebook.model.js";
import { ThamSo } from "../models/config.model.js";
import { NguoiDung, NhomNguoiDung, Quyen } from "../models/auth.model.js";
import { CTBangDiemMonHocSinh } from "../models/gradebook.model.js";
import sequelize from "../configs/sequelize.js";
import bcrypt from "bcryptjs";
import { sendAccountCreationEmail } from "../ultis/email.js";


// ===================== Helpers: NAMHOC =====================
function parseNamHoc(namHocText) {
  if (namHocText == null) return null;

  const s = String(namHocText).trim();
  const m = s.match(/^(\d{4})\s*[-/–—]\s*(\d{4})$/);
  if (!m) {
    throw { status: 400, message: "NamHoc phải có dạng YYYY-YYYY (vd: 2024-2025)" };
  }

  const Nam1 = Number(m[1]);
  const Nam2 = Number(m[2]);

  if (!Number.isInteger(Nam1) || !Number.isInteger(Nam2)) {
    throw { status: 400, message: "NamHoc không hợp lệ" };
  }
  if (Nam2 !== Nam1 + 1) {
    throw { status: 400, message: "NamHoc phải là 2 năm liên tiếp (vd: 2024-2025)" };
  }

  return { Nam1, Nam2 };
}

async function findOrCreateNamHoc({ Nam1, Nam2 }, t) {
  const [row] = await NamHoc.findOrCreate({
    where: { Nam1, Nam2 },
    defaults: { Nam1, Nam2 },
    transaction: t,
  });
  return row; // row.MaNH
}

// ===================== Helpers: THAMSO =====================
function mapThamSoPayload(payload = {}) {
  // Hỗ trợ cả camelCase (FE) lẫn PascalCase (DB/service cũ)
  return {
    TuoiToiThieu: payload.tuoiToiThieu ?? payload.TuoiToiThieu ?? null,
    TuoiToiDa: payload.tuoiToiDa ?? payload.TuoiToiDa ?? null,
    SiSoToiDa: payload.soHocSinhToiDa1Lop ?? payload.SiSoToiDa ?? null,

    DiemToiThieu: payload.diemToiThieu ?? payload.DiemToiThieu ?? null,
    DiemToiDa: payload.diemToiDa ?? payload.DiemToiDa ?? null,

    DiemDatMon: payload.diemDatToiThieu ?? payload.DiemDatMon ?? null,
    DiemDat: payload.diemToiThieuHocKy ?? payload.DiemDat ?? null,

    HesoMieng: payload.gradeWeight?.oral ?? payload.HesoMieng ?? null,
    HesoChinh15p: payload.gradeWeight?.main15p ?? payload.HesoChinh15p ?? null,
    HesoGiuaky: payload.gradeWeight?.midterm ?? payload.HesoGiuaky ?? null,
    HesoCuoiky: payload.gradeWeight?.final ?? payload.HesoCuoiky ?? null,
  };
}

function validateThamSo(data) {
  const isIntOrNull = (v) =>
    v == null || (Number.isInteger(v) && Number.isFinite(v));
  
  const isDecimalOrNull = (v) =>
    v == null || (typeof v === 'number' && isFinite(v));

  // int check for traditional parameters
  for (const k of [
    "TuoiToiThieu",
    "TuoiToiDa",
    "SiSoToiDa",
    "DiemToiThieu",
    "DiemToiDa",
    "DiemDatMon",
    "DiemDat",
  ]) {
    if (!isIntOrNull(data[k])) {
      throw { status: 400, message: `${k} phải là số nguyên (hoặc null)` };
    }
  }

  // decimal check for grade weights (must be between 0 and 100)
  for (const k of ["HesoMieng", "HesoChinh15p", "HesoGiuaky", "HesoCuoiky"]) {
    if (!isDecimalOrNull(data[k])) {
      throw { status: 400, message: `${k} phải là số thập phân (hoặc null)` };
    }
    if (data[k] != null && (data[k] < 0 || data[k] > 100)) {
      throw { status: 400, message: `${k} phải trong khoảng [0..100]` };
    }
  }

  // Check that grade weights sum to 100 if any are provided
  const weights = [data.HesoMieng, data.HesoChinh15p, data.HesoGiuaky, data.HesoCuoiky];
  const hasAnyWeight = weights.some(w => w != null);
  if (hasAnyWeight) {
    const sum = weights.reduce((a, b) => (a ?? 0) + (b ?? 0), 0);
    if (Math.abs(sum - 100) > 0.01) {  // allow small floating point errors
      throw { status: 400, message: `Tổng của các hệ số trọng số phải bằng 100 (hiện tại: ${sum.toFixed(2)})` };
    }
  }

  // range check
  if (data.TuoiToiThieu != null && data.TuoiToiDa != null && data.TuoiToiThieu > data.TuoiToiDa) {
    throw { status: 400, message: "TuoiToiThieu phải <= TuoiToiDa" };
  }
  if (data.DiemToiThieu != null && data.DiemToiDa != null && data.DiemToiThieu > data.DiemToiDa) {
    throw { status: 400, message: "DiemToiThieu phải <= DiemToiDa" };
  }

  // nếu bạn muốn enforce điểm 0..10 thì bật đoạn này
  // const in0to10 = (v) => v == null || (v >= 0 && v <= 10);
  // for (const k of ["DiemToiThieu","DiemToiDa","DiemDatMon","DiemDat"]) {
  //   if (!in0to10(data[k])) throw { status: 400, message: `${k} phải trong [0..10]` };
  // }
}

const pickField = (row, names = []) => {
  for (const name of names) {
    const val = row[name];
    if (val != null && String(val).trim() !== "") return typeof val === "string" ? val.trim() : val;
  }
  return null;
};

const normalizeBoolean = (val, fallback = false) => {
  if (val == null || val === "") return fallback;
  const s = String(val).trim().toLowerCase();
  if (["true", "1", "yes", "y", "ok", "send", "x"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return fallback;
};

export class AdminService {
  // ===== NAM HOC =====
  static async listNamHoc() {
    return await NamHoc.findAll({ order: [["MaNH", "DESC"]] });
  }

  static async createNamHoc(payload = {}) {
    // Accept either NamHoc text ("2024-2025") or Nam1/Nam2 numbers
    let Nam1 = payload.Nam1 ?? null;
    let Nam2 = payload.Nam2 ?? null;

    if (payload.NamHoc) {
      const parsed = parseNamHoc(payload.NamHoc);
      Nam1 = parsed.Nam1;
      Nam2 = parsed.Nam2;
    }

    if (!Number.isInteger(Nam1) || !Number.isInteger(Nam2)) {
      throw { status: 400, message: "Nam1 và Nam2 phải là số nguyên" };
    }
    if (Nam2 !== Nam1 + 1) {
      throw { status: 400, message: "Nam2 phải bằng Nam1 + 1 (vd: 2024-2025)" };
    }

    const existed = await NamHoc.findOne({ where: { Nam1, Nam2 } });
    if (existed) return existed;

    return await NamHoc.create({ Nam1, Nam2 });
  }

  static async deleteNamHoc(MaNH) {
    const row = await NamHoc.findByPk(MaNH);
    if (!row) throw { status: 404, message: "NamHoc not found" };

    const hasClasses = await Lop.count({ where: { MaNamHoc: MaNH } });
    if (hasClasses > 0) {
      throw { status: 400, message: "Không thể xoá năm học vì đang có lớp thuộc năm học này" };
    }

    const hasThamSo = await ThamSo.count({ where: { MaNamHoc: MaNH } });
    if (hasThamSo > 0) {
      throw { status: 400, message: "Không thể xoá năm học vì đang có tham số cấu hình gắn với năm học" };
    }

    await row.destroy();
    return { deleted: true };
  }

  // ===== KHOI LOP =====
  static async createKhoiLop({ TenKL, SoLop = null }) {
    if (!TenKL) throw { status: 400, message: "TenKL is required" };
    return await KhoiLop.create({ TenKL, SoLop });
  }

  static async updateKhoiLop(MaKL, { TenKL, SoLop }) {
    const row = await KhoiLop.findByPk(MaKL);
    if (!row) throw { status: 404, message: "KhoiLop not found" };
    await row.update({
      TenKL: TenKL ?? row.TenKL,
      SoLop: SoLop ?? row.SoLop,
    });
    return row;
  }

  static async deleteKhoiLop(MaKL) {
    const countLop = await Lop.count({ where: { MaKhoiLop: MaKL } });
    if (countLop > 0) throw { status: 400, message: "Không thể xoá khối vì đang có lớp thuộc khối" };
    const row = await KhoiLop.findByPk(MaKL);
    if (!row) throw { status: 404, message: "KhoiLop not found" };
    await row.destroy();
    return { deleted: true };
  }

  static async listKhoiLop({ includeClasses = false } = {}) {
    if (!includeClasses) return await KhoiLop.findAll({ order: [["MaKL", "ASC"]] });

    const khois = await KhoiLop.findAll({ order: [["MaKL", "ASC"]] });
    const maKls = khois.map((k) => k.MaKL);
    const lops = await Lop.findAll({
      where: { MaKhoiLop: { [Op.in]: maKls } },
      order: [["MaLop", "ASC"]],
    });

    const map = new Map();
    for (const lop of lops) {
      const key = lop.MaKhoiLop;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(lop);
    }
    return khois.map((k) => ({ ...k.toJSON(), danhSachLop: map.get(k.MaKL) || [] }));
  }

  // ===== MON HOC =====
  static async createMonHoc({ TenMonHoc, MaMon = null, HeSoMon, MoTa = null }) {
    if (!TenMonHoc) throw { status: 400, message: "TenMonHoc is required" };
    if (HeSoMon == null) throw { status: 400, message: "HeSoMon is required" };
    return await MonHoc.create({ TenMonHoc, MaMon, HeSoMon, MoTa });
  }

  static async updateMonHoc(MaMonHoc, payload) {
    const row = await MonHoc.findByPk(MaMonHoc);
    if (!row) throw { status: 404, message: "MonHoc not found" };
    await row.update({
      TenMonHoc: payload.TenMonHoc ?? row.TenMonHoc,
      MaMon: payload.MaMon ?? row.MaMon,
      HeSoMon: payload.HeSoMon ?? row.HeSoMon,
      MoTa: payload.MoTa ?? row.MoTa,
    });
    return row;
  }

  static async deleteMonHoc(MaMonHoc) {
    const row = await MonHoc.findByPk(MaMonHoc);
    if (!row) throw { status: 404, message: "MonHoc not found" };
    await row.destroy();
    return { deleted: true };
  }

  static async listMonHoc() {
    return await MonHoc.findAll({ order: [["MaMonHoc", "ASC"]] });
  }

  // ===== HOC KY =====
  static async createHocKy({ TenHK }) {
    if (!TenHK) throw { status: 400, message: "TenHK is required" };
    return await HocKy.create({ TenHK });
  }

  static async updateHocKy(MaHK, payload) {
    const row = await HocKy.findByPk(MaHK);
    if (!row) throw { status: 404, message: "HocKy not found" };
    await row.update({ TenHK: payload.TenHK ?? row.TenHK });
    return row;
  }

  static async deleteHocKy(MaHK) {
    const row = await HocKy.findByPk(MaHK);
    if (!row) throw { status: 404, message: "HocKy not found" };
    await row.destroy();
    return { deleted: true };
  }

  static async listHocKy() {
    return await HocKy.findAll({
      order: [["MaHK", "ASC"]],
    });
  }

  // ===== THAM SO (CRUD) =====

  // CREATE (theo năm học): nếu đã có rồi thì báo 409
  static async createThamSo({ MaNamHoc, ...payload }) {
    if (MaNamHoc == null) throw { status: 400, message: "MaNamHoc is required" };

    const existed = await ThamSo.findOne({ where: { MaNamHoc } });
    if (existed) throw { status: 409, message: "ThamSo của năm học này đã tồn tại (dùng update/upsert)" };

    const data = { ...mapThamSoPayload(payload), MaNamHoc };
    validateThamSo(data);

    return await ThamSo.create(data);
  }

  // UPSERT (theo năm học): đã có thì update, chưa có thì create
  static async upsertThamSoByNamHoc(MaNamHoc, payload) {
    if (MaNamHoc == null) throw { status: 400, message: "MaNamHoc is required" };

    const data = { ...mapThamSoPayload(payload), MaNamHoc };
    validateThamSo(data);

    const existed = await ThamSo.findOne({ where: { MaNamHoc } });
    if (!existed) return await ThamSo.create(data);

    await existed.update(data);
    return existed;
  }

  // READ ONE theo MaNamHoc
  static async getThamSoByNamHoc(MaNamHoc) {
    if (MaNamHoc == null) throw { status: 400, message: "MaNamHoc is required" };

    const row = await ThamSo.findOne({
      where: { MaNamHoc },
      include: [
        {
          model: NamHoc,
          as: "namHoc", // cần initAssociations ThamSo.belongsTo(NamHoc,{as:"namHoc"})
          attributes: ["MaNH", "Nam1", "Nam2"],
          required: false,
        },
      ],
    });

    if (!row) throw { status: 404, message: "ThamSo not found" };
    return row;
  }

  // READ ONE theo MaThamSo (nếu bạn cần)
  static async getThamSoById(MaThamSo) {
    const row = await ThamSo.findByPk(MaThamSo, {
      include: [
        { model: NamHoc, as: "namHoc", attributes: ["MaNH", "Nam1", "Nam2"], required: false },
      ],
    });
    if (!row) throw { status: 404, message: "ThamSo not found" };
    return row;
  }

  // LIST
  static async listThamSo({ MaNamHoc = null } = {}) {
    const where = {};
    if (MaNamHoc != null) where.MaNamHoc = MaNamHoc;

    return await ThamSo.findAll({
      where,
      order: [["MaNamHoc", "ASC"]],
      include: [
        { model: NamHoc, as: "namHoc", attributes: ["MaNH", "Nam1", "Nam2"], required: false },
      ],
    });
  }

  // UPDATE theo MaNamHoc
  static async updateThamSoByNamHoc(MaNamHoc, payload) {
    if (MaNamHoc == null) throw { status: 400, message: "MaNamHoc is required" };

    const row = await ThamSo.findOne({ where: { MaNamHoc } });
    if (!row) throw { status: 404, message: "ThamSo not found" };

    const mapped = mapThamSoPayload(payload);

    const next = {
      TuoiToiThieu: mapped.TuoiToiThieu ?? row.TuoiToiThieu,
      TuoiToiDa: mapped.TuoiToiDa ?? row.TuoiToiDa,
      SiSoToiDa: mapped.SiSoToiDa ?? row.SiSoToiDa,
      DiemToiThieu: mapped.DiemToiThieu ?? row.DiemToiThieu,
      DiemToiDa: mapped.DiemToiDa ?? row.DiemToiDa,
      DiemDatMon: mapped.DiemDatMon ?? row.DiemDatMon,
      DiemDat: mapped.DiemDat ?? row.DiemDat,
      MaNamHoc: row.MaNamHoc,
    };

    validateThamSo(next);

    await row.update(next);
    return row;
  }

  // UPDATE theo MaThamSo (nếu bạn cần)
  static async updateThamSoById(MaThamSo, payload) {
    const row = await ThamSo.findByPk(MaThamSo);
    if (!row) throw { status: 404, message: "ThamSo not found" };

    const mapped = mapThamSoPayload(payload);
    const next = {
      TuoiToiThieu: mapped.TuoiToiThieu ?? row.TuoiToiThieu,
      TuoiToiDa: mapped.TuoiToiDa ?? row.TuoiToiDa,
      SiSoToiDa: mapped.SiSoToiDa ?? row.SiSoToiDa,
      DiemToiThieu: mapped.DiemToiThieu ?? row.DiemToiThieu,
      DiemToiDa: mapped.DiemToiDa ?? row.DiemToiDa,
      DiemDatMon: mapped.DiemDatMon ?? row.DiemDatMon,
      DiemDat: mapped.DiemDat ?? row.DiemDat,
      MaNamHoc: row.MaNamHoc,
    };

    validateThamSo(next);

    await row.update(next);
    return row;
  }

  // DELETE theo MaNamHoc
  static async deleteThamSoByNamHoc(MaNamHoc) {
    if (MaNamHoc == null) throw { status: 400, message: "MaNamHoc is required" };

    const row = await ThamSo.findOne({ where: { MaNamHoc } });
    if (!row) throw { status: 404, message: "ThamSo not found" };

    await row.destroy();
    return { deleted: true };
  }

  // DELETE theo MaThamSo (nếu bạn cần)
  static async deleteThamSoById(MaThamSo) {
    const row = await ThamSo.findByPk(MaThamSo);
    if (!row) throw { status: 404, message: "ThamSo not found" };
    await row.destroy();
    return { deleted: true };
  }

  // ===== TRONG SO DIEM (LOAIHINHKIEMTRA) =====
  static async createLoaiHinhKiemTra({ TenLHKT, HeSo }) {
    if (!TenLHKT) throw { status: 400, message: "TenLHKT is required" };
    if (HeSo == null) throw { status: 400, message: "HeSo is required" };
    return await LoaiHinhKiemTra.create({ TenLHKT, HeSo });
  }

  static async updateLoaiHinhKiemTra(MaLHKT, payload) {
    const row = await LoaiHinhKiemTra.findByPk(MaLHKT);
    if (!row) throw { status: 404, message: "LoaiHinhKiemTra not found" };
    await row.update({
      TenLHKT: payload.TenLHKT ?? row.TenLHKT,
      HeSo: payload.HeSo ?? row.HeSo,
    });
    return row;
  }

  static async deleteLoaiHinhKiemTra(MaLHKT) {
    const row = await LoaiHinhKiemTra.findByPk(MaLHKT);
    if (!row) throw { status: 404, message: "LoaiHinhKiemTra not found" };
    await row.destroy();
    return { deleted: true };
  }

  static async listLoaiHinhKiemTra() {
    return await LoaiHinhKiemTra.findAll({ order: [["MaLHKT", "ASC"]] });
  }

  // ===== LOP =====
  static async createLop({ TenLop, MaKhoiLop, MaNamHoc, SiSo = null }) {
    if (!TenLop) throw { status: 400, message: "TenLop is required" };
    if (MaKhoiLop == null || MaNamHoc == null) throw { status: 400, message: "MaKhoiLop & MaNamHoc are required" };
    return await Lop.create({ TenLop, MaKhoiLop, MaNamHoc, SiSo });
  }

  static async listLop({ MaNamHoc = null, MaKhoiLop = null } = {}) {
    const where = {};
    if (MaNamHoc != null) where.MaNamHoc = MaNamHoc;
    if (MaKhoiLop != null) where.MaKhoiLop = MaKhoiLop;
    return await Lop.findAll({ where, order: [["MaLop", "ASC"]] });
  }

  static async deleteLop(MaLop) {
    const row = await Lop.findByPk(MaLop);
    if (!row) throw { status: 404, message: "Lop not found" };
    await row.destroy();
    return { deleted: true };
  }

  // ===== PHÂN CÔNG GIÁO VIÊN CHỦ NHIỆM =====
  static async assignHomeroomTeacher(MaLop, { MaGVCN }) {
    if (!Number.isInteger(Number(MaLop))) throw { status: 400, message: "MaLop không hợp lệ" };
    if (MaGVCN == null) throw { status: 400, message: "MaGVCN là bắt buộc" };

    const lop = await Lop.findByPk(Number(MaLop));
    if (!lop) throw { status: 404, message: "Lop not found" };

    const gv = await NguoiDung.findByPk(Number(MaGVCN), {
      include: [{ model: NhomNguoiDung, as: "nhom", required: false }],
      attributes: { exclude: ["MatKhau"] },
    });
    if (!gv) throw { status: 404, message: "NguoiDung (Giáo viên) không tồn tại" };

    // Không cho phân công tài khoản học sinh làm GVCN
    const tenNhom = String(gv?.nhom?.TenNhomNguoiDung || "").toLowerCase();
    if (tenNhom.includes("hoc sinh") || tenNhom.includes("student")) {
      throw { status: 400, message: "Không thể gán học sinh làm giáo viên chủ nhiệm" };
    }

    // Mỗi giáo viên chỉ được làm GVCN của tối đa một lớp
    const existingHomeroom = await Lop.findOne({ where: { MaGVCN: Number(MaGVCN) } });
    if (existingHomeroom && existingHomeroom.MaLop !== Number(MaLop)) {
      throw { status: 400, message: "Giáo viên này đã là GVCN của một lớp khác" };
    }

    await lop.update({ MaGVCN: Number(MaGVCN) });
    return await Lop.findByPk(Number(MaLop), {
      include: [{ model: NguoiDung, as: "GVCN", required: false, attributes: ["MaNguoiDung", "HoVaTen", "Email"] }],
    });
  }

  // ===== QUYEN (PERMISSIONS) =====
  static async createQuyen(payload) {
    const data = {
      PhanQuyenHeThong: payload.PhanQuyenHeThong ?? 0,
      ThayDoiThamSo: payload.ThayDoiThamSo ?? 0,
      ThayDoiQuyDinh: payload.ThayDoiQuyDinh ?? 0,
      DieuChinhNghiepVu: payload.DieuChinhNghiepVu ?? 0,
      TraCuuDiemVaLopHoc: payload.TraCuuDiemVaLopHoc ?? 0,
      TraCuuHocSinh: payload.TraCuuHocSinh ?? 0,
    };
    return await Quyen.create(data);
  }

  static async listQuyen() {
    return await Quyen.findAll({ order: [["MaQuyen", "ASC"]] });
  }

  static async getQuyen(MaQuyen) {
    const row = await Quyen.findByPk(MaQuyen);
    if (!row) throw { status: 404, message: "Quyen not found" };
    return row;
  }

  static async updateQuyen(MaQuyen, payload) {
    const row = await Quyen.findByPk(MaQuyen);
    if (!row) throw { status: 404, message: "Quyen not found" };
    await row.update({
      PhanQuyenHeThong: payload.PhanQuyenHeThong ?? row.PhanQuyenHeThong,
      ThayDoiThamSo: payload.ThayDoiThamSo ?? row.ThayDoiThamSo,
      ThayDoiQuyDinh: payload.ThayDoiQuyDinh ?? row.ThayDoiQuyDinh,
      DieuChinhNghiepVu: payload.DieuChinhNghiepVu ?? row.DieuChinhNghiepVu,
      TraCuuDiemVaLopHoc: payload.TraCuuDiemVaLopHoc ?? row.TraCuuDiemVaLopHoc,
      TraCuuHocSinh: payload.TraCuuHocSinh ?? row.TraCuuHocSinh,
    });
    return row;
  }

  static async deleteQuyen(MaQuyen) {
    const countNhom = await NhomNguoiDung.count({ where: { MaQuyen } });
    if (countNhom > 0) throw { status: 400, message: "Không thể xóa quyền vì đang có nhóm người dùng sử dụng" };
    const row = await Quyen.findByPk(MaQuyen);
    if (!row) throw { status: 404, message: "Quyen not found" };
    await row.destroy();
    return { deleted: true };
  }

  // ===== NHOM NGUOI DUNG (USER GROUPS) =====
  static async createNhomNguoiDung({ TenNhomNguoiDung, MaQuyen }) {
    if (!TenNhomNguoiDung) throw { status: 400, message: "TenNhomNguoiDung is required" };
    if (MaQuyen == null) throw { status: 400, message: "MaQuyen is required" };
    
    // Kiểm tra quyền có tồn tại không
    const quyen = await Quyen.findByPk(MaQuyen);
    if (!quyen) throw { status: 404, message: "Quyen not found" };
    
    return await NhomNguoiDung.create({ TenNhomNguoiDung, MaQuyen });
  }

  // ===== PHÂN CÔNG GIÁO VIÊN BỘ MÔN CHO BẢNG ĐIỂM MÔN =====
  static async assignSubjectTeacher({ MaLop, MaMon, MaHocKy, MaGV }) {
    if (MaLop == null || MaMon == null || MaHocKy == null || MaGV == null) {
      throw { status: 400, message: "MaLop, MaMon, MaHocKy, MaGV đều bắt buộc" };
    }

    const gv = await NguoiDung.findByPk(Number(MaGV), {
      include: [{ model: NhomNguoiDung, as: "nhom", required: false }],
      attributes: { exclude: ["MatKhau"] },
    });
    if (!gv) throw { status: 404, message: "NguoiDung (Giáo viên) không tồn tại" };
    const tenNhom = String(gv?.nhom?.TenNhomNguoiDung || "").toLowerCase();
    if (tenNhom.includes("hoc sinh") || tenNhom.includes("student")) {
      throw { status: 400, message: "Không thể gán học sinh làm giáo viên bộ môn" };
    }

    // Tìm hoặc tạo bảng điểm môn theo lớp-môn-học kỳ
    const [bdm] = await BangDiemMon.findOrCreate({
      where: { MaLop: Number(MaLop), MaHocKy: Number(MaHocKy), MaMon: Number(MaMon) },
      defaults: { MaLop: Number(MaLop), MaHocKy: Number(MaHocKy), MaMon: Number(MaMon) },
    });

    await bdm.update({ MaGV: Number(MaGV) });
    return await BangDiemMon.findByPk(bdm.MaBangDiemMon, {
      include: [
        { model: Lop, attributes: ["MaLop", "TenLop"], required: false },
        { model: HocKy, attributes: ["MaHK", "TenHK"], required: false },
        { model: MonHoc, attributes: ["MaMonHoc", "TenMonHoc"], required: false },
        { model: NguoiDung, as: "GVMon", attributes: ["MaNguoiDung", "HoVaTen", "Email"], required: false },
      ],
    });
  }

  static async listNhomNguoiDung() {
    return await NhomNguoiDung.findAll({
      order: [["MaNhomNguoiDung", "ASC"]],
      include: [
        {
          model: Quyen,
          as: "quyen",
          attributes: ["MaQuyen", "PhanQuyenHeThong", "ThayDoiThamSo", "ThayDoiQuyDinh", "DieuChinhNghiepVu", "TraCuuDiemVaLopHoc", "TraCuuHocSinh"],
          required: false,
        },
      ],
    });
  }

  static async getNhomNguoiDung(MaNhomNguoiDung) {
    const row = await NhomNguoiDung.findByPk(MaNhomNguoiDung, {
      include: [
        {
          model: Quyen,
          as: "quyen",
          required: false,
        },
      ],
    });
    if (!row) throw { status: 404, message: "NhomNguoiDung not found" };
    return row;
  }

  static async updateNhomNguoiDung(MaNhomNguoiDung, payload) {
    const row = await NhomNguoiDung.findByPk(MaNhomNguoiDung);
    if (!row) throw { status: 404, message: "NhomNguoiDung not found" };
    
    // Nếu có MaQuyen mới, kiểm tra tồn tại
    if (payload.MaQuyen != null) {
      const quyen = await Quyen.findByPk(payload.MaQuyen);
      if (!quyen) throw { status: 404, message: "Quyen not found" };
    }
    
    await row.update({
      TenNhomNguoiDung: payload.TenNhomNguoiDung ?? row.TenNhomNguoiDung,
      MaQuyen: payload.MaQuyen ?? row.MaQuyen,
    });
    return row;
  }

  static async deleteNhomNguoiDung(MaNhomNguoiDung) {
    const countUser = await NguoiDung.count({ where: { MaNhomNguoiDung } });
    if (countUser > 0) throw { status: 400, message: "Không thể xóa nhóm vì đang có người dùng thuộc nhóm" };
    const row = await NhomNguoiDung.findByPk(MaNhomNguoiDung);
    if (!row) throw { status: 404, message: "NhomNguoiDung not found" };
    await row.destroy();
    return { deleted: true };
  }

  // ===== NGUOI DUNG (USERS) =====
  static async createNguoiDung({ TenDangNhap, MatKhau, HoVaTen, Email, MaNhomNguoiDung, MaHocSinh = null, sendEmail = true }) {
    if (!TenDangNhap) throw { status: 400, message: "TenDangNhap is required" };
    if (!MatKhau) throw { status: 400, message: "MatKhau is required" };
    if (MaNhomNguoiDung == null) throw { status: 400, message: "MaNhomNguoiDung is required" };
    if (MaHocSinh) throw { status: 400, message: "Admin chỉ được tạo tài khoản giáo viên (không gán học sinh)" };
    
    // Kiểm tra tên đăng nhập đã tồn tại chưa
    const existed = await NguoiDung.findOne({ where: { TenDangNhap } });
    if (existed) throw { status: 409, message: "TenDangNhap đã tồn tại" };
    
    // Kiểm tra nhóm người dùng có tồn tại không
    const nhom = await NhomNguoiDung.findByPk(MaNhomNguoiDung);
    if (!nhom) throw { status: 404, message: "NhomNguoiDung not found" };
    const tenNhom = (nhom.TenNhomNguoiDung || "").toLowerCase();
    if (tenNhom.includes("hoc sinh") || tenNhom.includes("student")) {
      throw { status: 400, message: "Admin chỉ được tạo tài khoản giáo viên" };
    }
    
    // Lưu mật khẩu gốc để gửi email
    const plainPassword = MatKhau;
    
    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(MatKhau, 10);
    
    const newUser = await NguoiDung.create({
      TenDangNhap,
      MatKhau: hashedPassword,
      HoVaTen,
      Email,
      MaNhomNguoiDung,
      MaHocSinh: null,
    });
    
    // Gửi email thông tin tài khoản nếu có email và sendEmail = true
    if (sendEmail && Email) {
      try {
        const isStudent = MaHocSinh != null;
        await sendAccountCreationEmail({
          email: Email,
          hoVaTen: HoVaTen || "Người dùng",
          tenDangNhap: TenDangNhap,
          matKhau: plainPassword,
          userType: "teacher",
        });
      } catch (emailError) {
        console.error("Lỗi gửi email:", emailError);
        // Không throw lỗi, chỉ log để không ảnh hưởng đến việc tạo tài khoản
      }
    }
    
    return newUser;
  }

  static async listNguoiDung({ MaNhomNguoiDung = null } = {}) {
    const where = {};
    if (MaNhomNguoiDung != null) where.MaNhomNguoiDung = MaNhomNguoiDung;
    
    return await NguoiDung.findAll({
      where,
      order: [["MaNguoiDung", "ASC"]],
      attributes: { exclude: ["MatKhau"] }, // Không trả về mật khẩu
      include: [
        {
          model: NhomNguoiDung,
          as: "nhom",
          required: false,
          include: [
            {
              model: Quyen,
              as: "quyen",
              required: false,
            },
          ],
        },
        {
          model: HocSinh,
          as: "hocSinh",
          required: false,
          attributes: ["MaHocSinh", "HoTen", "Email"],
        },
      ],
    });
  }

  static async getNguoiDung(MaNguoiDung) {
    const row = await NguoiDung.findByPk(MaNguoiDung, {
      attributes: { exclude: ["MatKhau"] },
      include: [
        {
          model: NhomNguoiDung,
          as: "nhom",
          required: false,
          include: [
            {
              model: Quyen,
              as: "quyen",
              required: false,
            },
          ],
        },
        {
          model: HocSinh,
          as: "hocSinh",
          required: false,
        },
      ],
    });
    if (!row) throw { status: 404, message: "NguoiDung not found" };
    return row;
  }

  static async updateNguoiDung(MaNguoiDung, payload) {
    const row = await NguoiDung.findByPk(MaNguoiDung);
    if (!row) throw { status: 404, message: "NguoiDung not found" };
    
    // Nếu thay đổi tên đăng nhập, kiểm tra trùng
    if (payload.TenDangNhap && payload.TenDangNhap !== row.TenDangNhap) {
      const existed = await NguoiDung.findOne({ where: { TenDangNhap: payload.TenDangNhap } });
      if (existed) throw { status: 409, message: "TenDangNhap đã tồn tại" };
    }
    
    // Nếu có nhóm mới, kiểm tra tồn tại và không cho đặt nhóm học sinh
    if (payload.MaNhomNguoiDung != null) {
      const nhom = await NhomNguoiDung.findByPk(payload.MaNhomNguoiDung);
      if (!nhom) throw { status: 404, message: "NhomNguoiDung not found" };
      const tenNhom = (nhom.TenNhomNguoiDung || "").toLowerCase();
      if (tenNhom.includes("hoc sinh") || tenNhom.includes("student")) {
        throw { status: 400, message: "Admin chỉ được tạo/sửa tài khoản giáo viên" };
      }
    }

    // Không cho gán học sinh vào tài khoản giáo viên
    if (payload.MaHocSinh) {
      throw { status: 400, message: "Không gán học sinh cho tài khoản giáo viên" };
    }
    
    const updateData = {
      TenDangNhap: payload.TenDangNhap ?? row.TenDangNhap,
      HoVaTen: payload.HoVaTen ?? row.HoVaTen,
      Email: payload.Email ?? row.Email,
      MaNhomNguoiDung: payload.MaNhomNguoiDung ?? row.MaNhomNguoiDung,
      MaHocSinh: null,
    };
    
    // Nếu có mật khẩu mới, hash nó
    if (payload.MatKhau) {
      updateData.MatKhau = await bcrypt.hash(payload.MatKhau, 10);
    }
    
    await row.update(updateData);
    return row;
  }

  static async deleteNguoiDung(MaNguoiDung) {
    return await sequelize.transaction(async (t) => {
      const user = await NguoiDung.findByPk(MaNguoiDung, { transaction: t });
      if (!user) throw { status: 404, message: "NguoiDung not found" };

      // Lưu MaHocSinh trước khi xóa user
      const MaHocSinh = user.MaHocSinh;

      // Xóa user khỏi bảng NGUOIDUNG trước (vì có FK constraint)
      await user.destroy({ transaction: t });

      // Nếu user có MaHocSinh (là học sinh), xóa toàn bộ dữ liệu liên quan
      if (MaHocSinh) {
        // Xóa điểm thi của học sinh
        await CTBangDiemMonHocSinh.destroy({ where: { MaHocSinh }, transaction: t });
        
        // Xóa học sinh khỏi các lớp
        await HocSinhLop.destroy({ where: { MaHocSinh }, transaction: t });
        
        // Xóa học sinh khỏi bảng HOCSINH
        const student = await HocSinh.findByPk(MaHocSinh, { transaction: t });
        if (student) {
          await student.destroy({ transaction: t });
        }
      }
      
      return { deleted: true };
    });
  }

  static async resetMatKhau(MaNguoiDung, { MatKhauMoi }) {
    if (!MatKhauMoi) throw { status: 400, message: "MatKhauMoi is required" };
    
    const row = await NguoiDung.findByPk(MaNguoiDung);
    if (!row) throw { status: 404, message: "NguoiDung not found" };
    
    const hashedPassword = await bcrypt.hash(MatKhauMoi, 10);
    await row.update({ MatKhau: hashedPassword });
    
    return { success: true, message: "Mật khẩu đã được đặt lại" };
  }

  static async importNguoiDungFromRows(rows = [], { sendEmail = false } = {}) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw { status: 400, message: "File không có dữ liệu" };
    }

    const groups = await NhomNguoiDung.findAll();
    const groupById = new Map(groups.map((g) => [Number(g.MaNhomNguoiDung), g]));
    const groupByName = new Map(groups.map((g) => [String(g.TenNhomNguoiDung || "").trim().toLowerCase(), g]));
    const defaultTeacherGroup = groups.find((g) => {
      const name = String(g.TenNhomNguoiDung || "").toLowerCase();
      return !name.includes("hoc sinh") && !name.includes("student");
    });

    const errors = [];
    const candidates = [];
    const usernamesInFile = new Set();

    // Bước 1: Chuẩn hóa & kiểm tra đầu vào, gom dữ liệu hợp lệ trước khi hit DB
    for (let idx = 0; idx < rows.length; idx += 1) {
      const row = rows[idx] || {};
      const rowNumber = idx + 2; // assuming row 1 is header

      const TenDangNhap = pickField(row, ["Tên đăng nhập", "TenDangNhap", "Username", "user", "TaiKhoan", "Account", "username"]);
      const MatKhau = pickField(row, ["Mật khẩu", "MatKhau", "Password", "Mat khau", "Pass"]);
      const HoVaTen = pickField(row, ["Họ và tên", "HoVaTen", "HoTen", "FullName", "Ho va ten"]);
      const Email = pickField(row, ["Email", "Mail", "DiaChiEmail"]);
      const MaNhomNguoiDungRaw = pickField(row, ["MaNhomNguoiDung", "MaNhom", "GroupId"]);
      const TenNhomNguoiDungField = pickField(row, ["Nhóm người dùng", "TenNhomNguoiDung", "Nhom", "Role", "GroupName"]);
      const sendEmailRow = normalizeBoolean(pickField(row, ["Gửi thông tin đăng nhập qua email", "GuiEmail", "SendEmail", "Email?", "send_email"]), true);

      if (!TenDangNhap || !MatKhau || !HoVaTen || !Email) {
        errors.push({ row: rowNumber, message: "Thiếu Tên đăng nhập/Mật khẩu/Họ và tên/Email" });
        continue;
      }

      // Kiểm tra trùng username trong chính file import để tránh vòng lặp DB dư thừa
      if (usernamesInFile.has(TenDangNhap)) {
        errors.push({ row: rowNumber, message: "Trùng Tên đăng nhập trong file" });
        continue;
      }
      usernamesInFile.add(TenDangNhap);

      let MaNhomNguoiDung = null;
      if (MaNhomNguoiDungRaw != null && !Number.isNaN(Number(MaNhomNguoiDungRaw))) {
        MaNhomNguoiDung = Number(MaNhomNguoiDungRaw);
      } else if (TenNhomNguoiDungField) {
        const g = groupByName.get(String(TenNhomNguoiDungField).trim().toLowerCase());
        MaNhomNguoiDung = g?.MaNhomNguoiDung ?? null;
      } else if (defaultTeacherGroup) {
        MaNhomNguoiDung = defaultTeacherGroup.MaNhomNguoiDung;
      }

      if (!MaNhomNguoiDung || !groupById.has(MaNhomNguoiDung)) {
        errors.push({ row: rowNumber, message: "Không tìm thấy nhóm người dùng hợp lệ" });
        continue;
      }

      candidates.push({
        rowNumber,
        TenDangNhap,
        MatKhau,
        HoVaTen,
        Email,
        MaNhomNguoiDung,
        sendEmail: sendEmail && sendEmailRow, // chỉ gửi email nếu bật query sendEmail
      });
    }

    if (candidates.length === 0) {
      return { total: rows.length, imported: 0, failed: errors.length, errors };
    }

    // Bước 2: Kiểm tra trùng username trong DB một lần
    const existedUsers = await NguoiDung.findAll({
      where: { TenDangNhap: { [Op.in]: Array.from(usernamesInFile) } },
      attributes: ["TenDangNhap"],
    });
    const existedSet = new Set(existedUsers.map((u) => u.TenDangNhap));

    const rowsToCreate = [];
    for (const c of candidates) {
      if (existedSet.has(c.TenDangNhap)) {
        errors.push({ row: c.rowNumber, message: "Tên đăng nhập đã tồn tại" });
        continue;
      }
      rowsToCreate.push(c);
    }

    if (rowsToCreate.length === 0) {
      return { total: rows.length, imported: 0, failed: errors.length, errors };
    }

    // Bước 3: Hash password song song có giới hạn để tránh nghẽn CPU
    const MAX_CONCURRENCY = 8;
    const queue = [...rowsToCreate];
    const hashedPayloads = [];

    const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, queue.length) }, async () => {
      while (queue.length) {
        const item = queue.pop();
        if (!item) break;
        const hashed = await bcrypt.hash(item.MatKhau, 10);
        hashedPayloads.push({
          TenDangNhap: item.TenDangNhap,
          MatKhau: hashed,
          HoVaTen: item.HoVaTen,
          Email: item.Email,
          MaNhomNguoiDung: item.MaNhomNguoiDung,
          MaHocSinh: null,
          sendEmail: item.sendEmail,
          rowNumber: item.rowNumber,
        });
      }
    });
    await Promise.all(workers);

    // Bước 4: Bulk create trong 1 transaction để giảm round-trip
    await sequelize.transaction(async (t) => {
      await NguoiDung.bulkCreate(
        hashedPayloads.map((p) => ({
          TenDangNhap: p.TenDangNhap,
          MatKhau: p.MatKhau,
          HoVaTen: p.HoVaTen,
          Email: p.Email,
          MaNhomNguoiDung: p.MaNhomNguoiDung,
          MaHocSinh: null,
        })),
        { transaction: t }
      );
    });

    // Bước 5: (Tuỳ chọn) Gửi email sau cùng, không block kết quả import
    if (hashedPayloads.some((p) => p.sendEmail)) {
      // không await để tránh timeout, log lỗi nếu có
      Promise.allSettled(
        hashedPayloads
          .filter((p) => p.sendEmail)
          .map((p) =>
            sendAccountCreationEmail({
              email: p.Email,
              username: p.TenDangNhap,
              password: "(đã được đặt trong hệ thống)",
              name: p.HoVaTen,
            })
          )
      ).catch((err) => {
        console.error("Send email after import failed", err);
      });
    }

    return {
      total: rows.length,
      imported: rowsToCreate.length,
      failed: errors.length,
      errors,
    };
  }

  // ===== QUẢN LÝ PHÂN CÔNG GIÁO VIÊN =====
  static async listClassAssignments({ MaNamHoc = null, MaKhoiLop = null } = {}) {
    const where = {};
    if (MaNamHoc != null) where.MaNamHoc = MaNamHoc;
    if (MaKhoiLop != null) where.MaKhoiLop = MaKhoiLop;

    const classes = await Lop.findAll({
      where,
      include: [
        { model: KhoiLop, as: "KhoiLop", attributes: ["MaKL", "TenKL"], required: false },
        { model: NamHoc, as: "NamHoc", attributes: ["MaNH", "Nam1", "Nam2"], required: false },
        { 
          model: NguoiDung, 
          as: "GVCN", 
          required: false, 
          attributes: ["MaNguoiDung", "HoVaTen", "Email"] 
        },
      ],
      order: [["MaLop", "ASC"]],
    });

    // Get subject teachers for all classes
    const classIds = classes.map(c => c.MaLop);
    const subjectTeachers = await BangDiemMon.findAll({
      where: { MaLop: { [Op.in]: classIds } },
      include: [
        { model: MonHoc, attributes: ["MaMonHoc", "TenMonHoc", "MaMon"], required: false },
        { model: HocKy, attributes: ["MaHK", "TenHK"], required: false },
        { 
          model: NguoiDung, 
          as: "GVMon", 
          required: false, 
          attributes: ["MaNguoiDung", "HoVaTen", "Email"] 
        },
      ],
    });

    // Map subject teachers by class
    const subjectMap = {};
    for (const st of subjectTeachers) {
      if (!subjectMap[st.MaLop]) subjectMap[st.MaLop] = [];
      subjectMap[st.MaLop].push({
        MaBangDiemMon: st.MaBangDiemMon,
        MaMon: st.MaMon,
        TenMonHoc: st.MonHoc?.TenMonHoc || st.MONHOC?.TenMonHoc || null,
        MaHocKy: st.MaHocKy,
        TenHocKy: st.HocKy?.TenHK || st.HOCKY?.TenHK || null,
        MaGV: st.MaGV,
        HoVaTenGV: st.GVMon?.HoVaTen || null,
        EmailGV: st.GVMon?.Email || null,
      });
    }

    return classes.map(c => ({
      MaLop: c.MaLop,
      TenLop: c.TenLop,
      MaKhoiLop: c.MaKhoiLop,
      TenKhoiLop: c.KhoiLop?.TenKL || null,
      MaNamHoc: c.MaNamHoc,
      NamHoc: c.NamHoc ? `${c.NamHoc.Nam1}-${c.NamHoc.Nam2}` : null,
      MaGVCN: c.MaGVCN,
      HoVaTenGVCN: c.GVCN?.HoVaTen || null,
      EmailGVCN: c.GVCN?.Email || null,
      subjectTeachers: subjectMap[c.MaLop] || [],
    }));
  }

  static async removeHomeroomTeacher(MaLop) {
    const lop = await Lop.findByPk(Number(MaLop));
    if (!lop) throw { status: 404, message: "Lớp không tồn tại" };
    await lop.update({ MaGVCN: null });
    return { success: true };
  }

  static async removeSubjectTeacher(MaBangDiemMon) {
    const bangDiem = await BangDiemMon.findByPk(Number(MaBangDiemMon));
    if (!bangDiem) throw { status: 404, message: "Phân công không tồn tại" };
    
    // Check if there are any grades entered
    const hasGrades = await CTBangDiemMonHocSinh.count({
      where: { MaBangDiemMon: Number(MaBangDiemMon) }
    });
    
    if (hasGrades > 0) {
      throw { status: 400, message: "Không thể xóa phân công đã có điểm" };
    }
    
    await bangDiem.destroy();
    return { success: true };
  }
}
