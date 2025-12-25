import sequelize  from "../configs/sequelize.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";

import { Lop, HocSinh, HocSinhLop } from "../models/student.model.js";
import { MonHoc, LoaiHinhKiemTra, KhoiLop, HocKy, NamHoc } from "../models/academic.model.js";
import { ThamSo } from "../models/config.model.js";
import { NguoiDung, NhomNguoiDung } from "../models/auth.model.js";
import { BangDiemMon, CTBangDiemMonHocSinh, CTBangDiemMonLHKT } from "../models/gradebook.model.js";
import { parseSpreadsheet } from "../ultis/spreadsheet.js";

const pickField = (row, names = []) => {
  for (const name of names) {
    const val = row[name];
    if (val != null && String(val).trim() !== "") return typeof val === "string" ? val.trim() : val;
  }
  return null;
};

const normalizeGender = (value) => {
  const s = String(value || "").trim().toLowerCase();
  if (s === "nam" || s === "male" || s === "m") return "Nam";
  if (s === "nu" || s === "nữ" || s === "female" || s === "f") return "Nu";
  return value || "Nam";
};

const normalizeDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  
  // If already YYYY-MM-DD string, return as-is
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  
  // Handle Excel date serial
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
  }
  
  // Try parsing as string date (spreadsheet.js already normalized)
  const s = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

export class TeacherService {
  // ===== PHÂN CÔNG GIÁO VIÊN (XEM) =====
  static async listAssignmentsForTeacher({ MaGV }) {
    if (MaGV == null) throw { status: 400, message: "MaGV là bắt buộc" };

    console.log('[listAssignmentsForTeacher] Querying for MaGV:', MaGV);

    const homeroom = await Lop.findAll({
      where: { MaGVCN: Number(MaGV) },
      include: [
        { model: KhoiLop, as: "KhoiLop", attributes: ["MaKL", "TenKL"], required: false },
        { model: NamHoc, as: "NamHoc", attributes: ["MaNH", "Nam1", "Nam2"], required: false },
      ],
      order: [["MaLop", "ASC"]],
    });

    const subject = await BangDiemMon.findAll({
      where: { MaGV: Number(MaGV) },
      include: [
        {
          model: Lop,
          attributes: ["MaLop", "TenLop", "MaKhoiLop", "MaNamHoc"],
          required: false,
          include: [
            { model: KhoiLop, as: "KhoiLop", attributes: ["MaKL", "TenKL"], required: false },
            { model: NamHoc, as: "NamHoc", attributes: ["MaNH", "Nam1", "Nam2"], required: false },
          ],
        },
        { model: HocKy, attributes: ["MaHK", "TenHK"], required: false },
        { model: MonHoc, attributes: ["MaMonHoc", "TenMonHoc", "MaMon"], required: false },
      ],
      order: [["MaLop", "ASC"], ["MaHocKy", "ASC"], ["MaMon", "ASC"]],
    });

    console.log('[listAssignmentsForTeacher] Found:', {
      homeroomCount: homeroom.length,
      subjectCount: subject.length,
      sampleSubject: subject[0] ? {
        MaBangDiemMon: subject[0].MaBangDiemMon,
        MaLop: subject[0].MaLop,
        MaHocKy: subject[0].MaHocKy,
        MaMon: subject[0].MaMon,
        keys: Object.keys(subject[0].dataValues || subject[0]),
        rawLOP: subject[0].LOP ? 'exists' : 'null',
        rawLop: subject[0].Lop ? 'exists' : 'null',
        rawHOCKY: subject[0].HOCKY ? 'exists' : 'null',
        rawHocKy: subject[0].HocKy ? 'exists' : 'null',
        rawMONHOC: subject[0].MONHOC ? 'exists' : 'null',
        rawMonHoc: subject[0].MonHoc ? 'exists' : 'null'
      } : null
    });

    const mappedSubject = subject.map((r, idx) => {
      // Try both uppercase and normal case for associations
      const lop = r.LOP || r.Lop;
      const hocKy = r.HOCKY || r.HocKy;
      const monHoc = r.MONHOC || r.MonHoc;
      
      const mapped = {
        MaBangDiemMon: r.MaBangDiemMon,
        MaLop: r.MaLop,
        TenLop: lop?.TenLop || null,
        Khoi: lop?.KhoiLop?.TenKL || null,
        NamHoc: lop?.NamHoc ? `${lop.NamHoc.Nam1}-${lop.NamHoc.Nam2}` : null,
        MaHocKy: r.MaHocKy,
        TenHocKy: hocKy?.TenHK || null,
        MaMon: r.MaMon,
        TenMonHoc: monHoc?.TenMonHoc || null,
      };
      console.log(`[listAssignmentsForTeacher] Subject item ${idx}:`, {
        raw: { MaMon: r.MaMon, MaMonHoc: r.MonHoc?.MaMonHoc },
        mapped
      });
      return mapped;
    });

    return {
      homeroom: homeroom.map((r) => ({
        MaLop: r.MaLop,
        TenLop: r.TenLop,
        Khoi: r.KhoiLop?.TenKL || null,
        NamHoc: r.NamHoc ? `${r.NamHoc.Nam1}-${r.NamHoc.Nam2}` : null,
      })),
      subject: mappedSubject,
    };
  }

  // ===== XEM DS LOP (theo giáo viên) =====
  static async listClasses({ MaGV = null, MaNamHoc = null, MaKhoiLop = null, MaHocKy = null } = {}) {
    const teacherId = Number(MaGV);
    if (!MaGV || Number.isNaN(teacherId) || teacherId <= 0) {
      console.warn('[listClasses] Invalid MaGV:', MaGV);
      return []; // Return empty array instead of throwing error
    }
    
    console.log('[listClasses] Querying for teacher:', teacherId, 'with filters:', { MaNamHoc, MaKhoiLop, MaHocKy });

    // 1) Lớp chủ nhiệm
    const homeroomWhere = { MaGVCN: teacherId };
    if (MaNamHoc != null) homeroomWhere.MaNamHoc = MaNamHoc;
    if (MaKhoiLop != null) homeroomWhere.MaKhoiLop = MaKhoiLop;

    const homeroom = await Lop.findAll({
      where: homeroomWhere,
      include: [
        { model: KhoiLop, as: "KhoiLop", attributes: ["MaKL", "TenKL"] },
        { model: NamHoc, as: "NamHoc", attributes: ["MaNH", "Nam1", "Nam2"] },
      ],
      order: [["MaLop", "ASC"]],
    });

    // 2) Lớp dạy bộ môn (BangDiemMon)
    const subjectWhere = { MaGV: teacherId };
    if (MaHocKy != null) subjectWhere.MaHocKy = MaHocKy;

    const subjectAssignments = await BangDiemMon.findAll({
      where: subjectWhere,
      include: [
        {
          model: Lop,
          include: [
            { model: KhoiLop, as: "KhoiLop", attributes: ["MaKL", "TenKL"] },
            { model: NamHoc, as: "NamHoc", attributes: ["MaNH", "Nam1", "Nam2"] },
          ],
        },
        { model: MonHoc, attributes: ["MaMonHoc", "TenMonHoc", "MaMon"] },
        { model: HocKy, attributes: ["MaHK", "TenHK"] },
      ],
      order: [["MaLop", "ASC"], ["MaHocKy", "ASC"], ["MaMon", "ASC"]],
    });

    // 3) Gộp kết quả theo lớp
    const classMap = new Map();

    const upsert = (cls) => {
      if (!cls) return null;
      const current = classMap.get(cls.MaLop) || {
        MaLop: cls.MaLop,
        TenLop: cls.TenLop,
        MaKhoiLop: cls.MaKhoiLop,
        TenKhoiLop: cls.KhoiLop?.TenKL || null,
        MaNamHoc: cls.MaNamHoc,
        NamHoc: cls.NamHoc ? `${cls.NamHoc.Nam1}-${cls.NamHoc.Nam2}` : null,
        roles: [],
        subjects: [],
      };
      classMap.set(cls.MaLop, current);
      return current;
    };

    for (const r of homeroom) {
      const cur = upsert(r);
      if (cur && !cur.roles.includes("homeroom")) cur.roles.push("homeroom");
    }

    for (const r of subjectAssignments) {
      // Handle association alias differences (Sequelize may use uppercase keys)
      const lop = r.LOP || r.Lop;

      // respect optional filters on Lop
      if (MaNamHoc != null && (lop?.MaNamHoc ?? null) !== MaNamHoc) continue;
      if (MaKhoiLop != null && (lop?.MaKhoiLop ?? null) !== MaKhoiLop) continue;

      const cur = upsert(lop || r);
      if (!cur) continue;
      if (!cur.roles.includes("subject")) cur.roles.push("subject");

      const MaMon = r.MaMon;
      const already = cur.subjects.find((s) => s.MaMon === MaMon && s.MaHocKy === r.MaHocKy);
      if (!already) {
        cur.subjects.push({
          MaMon,
          TenMonHoc: r.MonHoc?.TenMonHoc || null,
          MaHocKy: r.MaHocKy,
          TenHK: r.HOCKY?.TenHK || r.HocKy?.TenHK || null,
        });
      }
    }

    // 4) Đếm sĩ số nếu có MaHocKy
    if (MaHocKy != null) {
      await Promise.all(
        Array.from(classMap.values()).map(async (cls) => {
          const count = await HocSinhLop.count({ where: { MaLop: cls.MaLop, MaHocKy } });
          cls.SoLuongHocSinh = count;
        })
      );
    }

    // 5) Trả về danh sách theo MaLop ASC
    return Array.from(classMap.values()).sort((a, b) => Number(a.MaLop) - Number(b.MaLop));
  }

  // ===== LAY DS HOC SINH THEO LOP VA HOC KY =====
  static async getStudentsByClass({ MaLop, MaHocKy }) {
    if (!MaLop || !MaHocKy) throw { status: 400, message: "MaLop and MaHocKy are required" };
    
    const enrollments = await HocSinhLop.findAll({
      where: { MaLop, MaHocKy },
      include: [{
        model: HocSinh,
        as: "HocSinh",
      }],
      order: [["MaHocSinh", "ASC"]],
    });

    return enrollments.map(e => ({
      ...e.HocSinh?.toJSON(),
      DiemTBHK: e.DiemTBHK,
    }));
  }

  // ===== THEM HOC SINH VAO LOP =====
  static async addStudentToClass({
    MaLop,
    MaHocKy,
    student: { MaHocSinh, HoTen, GioiTinh, NgaySinh, Email = null, SDT = null, DiaChi = null, NgayTiepNhan = null, GhiChu = null },
  }) {
    if (MaLop == null || MaHocKy == null) throw { status: 400, message: "MaLop & MaHocKy are required" };
    if (MaHocSinh == null) throw { status: 400, message: "MaHocSinh is required (not auto)" };

    return await sequelize.transaction(async (t) => {
      const existed = await HocSinh.findByPk(MaHocSinh, { transaction: t });
      if (!existed) {
        if (!HoTen || !GioiTinh || !NgaySinh) throw { status: 400, message: "HoTen/GioiTinh/NgaySinh are required" };
        await HocSinh.create(
          { MaHocSinh, HoTen, GioiTinh, NgaySinh, Email, SDT, DiaChi, NgayTiepNhan, GhiChu },
          { transaction: t }
        );
      }

      const duplicated = await HocSinhLop.findOne({ where: { MaLop, MaHocSinh, MaHocKy }, transaction: t });
      if (duplicated) throw { status: 400, message: "Học sinh đã có trong lớp ở học kỳ này" };

      const lop = await Lop.findByPk(MaLop, { transaction: t });
      if (lop?.MaNamHoc) {
        const ts = await ThamSo.findOne({ where: { MaNamHoc: lop.MaNamHoc }, transaction: t });
        
        // Validate age (tuổi)
        if (NgaySinh && (ts?.Tuoi_Toi_Thieu != null || ts?.Tuoi_Toi_Da != null)) {
          const today = new Date();
          const birthDate = new Date(NgaySinh);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (ts?.Tuoi_Toi_Thieu != null && age < ts.Tuoi_Toi_Thieu) {
            throw { status: 400, message: `Tuổi học sinh (${age}) phải >= ${ts.Tuoi_Toi_Thieu}` };
          }
          if (ts?.Tuoi_Toi_Da != null && age > ts.Tuoi_Toi_Da) {
            throw { status: 400, message: `Tuổi học sinh (${age}) phải <= ${ts.Tuoi_Toi_Da}` };
          }
        }
        
        // Validate class size (sĩ số)
        if (ts?.Si_So_Toi_Da) {
          const current = await HocSinhLop.count({ where: { MaLop, MaHocKy }, transaction: t });
          if (current + 1 > ts.Si_So_Toi_Da) throw { status: 400, message: "Vượt sĩ số tối đa của lớp" };
        }
      }

      // Enroll student to class/semester
      const enroll = await HocSinhLop.create({ MaLop, MaHocSinh, MaHocKy }, { transaction: t });

      // Auto-create student account if missing and email provided
      // Do inside transaction for DB, but email will be sent after commit.
      let createdAccount = null;
      if (Email) {
        const existedAcc = await NguoiDung.findOne({ where: { MaHocSinh }, transaction: t });
        if (!existedAcc) {
          const studentGroup = await NhomNguoiDung.findOne({ where: { TenNhomNguoiDung: "student" }, transaction: t });
          if (!studentGroup) throw { status: 500, message: "Chưa có nhóm 'student' trong NHOMNGUOIDUNG" };

          // username pattern: hs{MaHocSinh} (ensure unique by fallback with suffix)
          let TenDangNhap = `${MaHocSinh}`;
          const existedUsername = await NguoiDung.findOne({ where: { TenDangNhap }, transaction: t });
          if (existedUsername) {
            TenDangNhap = `hs${MaHocSinh}_${Date.now().toString().slice(-4)}`;
          }

          // generate random temporary password
          const tempPass = Math.random().toString(36).slice(-10);
          const MatKhau = await bcrypt.hash(tempPass, 10);

          const user = await NguoiDung.create(
            {
              TenDangNhap,
              MatKhau,
              HoVaTen: HoTen,
              Email,
              MaNhomNguoiDung: studentGroup.MaNhomNguoiDung,
              MaHocSinh,
            },
            { transaction: t }
          );

          createdAccount = { TenDangNhap, tempPass, Email, HoTen };
        }
      }

      // Attach meta to return (email will be sent after commit externally)
      return { enroll, createdAccount };
    });
  }

  // ===== SUA / XOA HOC SINH =====
  static async updateStudent(MaHocSinh, payload) {
    const hs = await HocSinh.findByPk(MaHocSinh);
    if (!hs) throw { status: 404, message: "HocSinh not found" };
    await hs.update(payload);
    return hs;
  }

  static async deleteStudent(MaHocSinh) {
    // Xóa toàn bộ dữ liệu liên quan đến học sinh
    return await sequelize.transaction(async (t) => {
      // Xóa điểm thi của học sinh
      await CTBangDiemMonHocSinh.destroy({ where: { MaHocSinh }, transaction: t });
      
      // Xóa học sinh khỏi các lớp
      await HocSinhLop.destroy({ where: { MaHocSinh }, transaction: t });

      // Xóa tài khoản người dùng gắn với học sinh
      await NguoiDung.destroy({ where: { MaHocSinh }, transaction: t });

      // Xóa học sinh khỏi bảng HOCSINH
      const hs = await HocSinh.findByPk(MaHocSinh, { transaction: t });
      if (!hs) throw { status: 404, message: "HocSinh not found" };
      await hs.destroy({ transaction: t });
      
      return { deleted: true };
    });
  }

  // ===== NHAP BANG DIEM (Lop + Mon + HocKy) =====
  /**
   * input ví dụ:
   * {
   *   MaLop, MaHocKy, MaMon,
   *   scores: [
   *     { MaHocSinh: 1001, details: [ { MaLHKT: 1, Lan: 1, Diem: 7.5 }, ... ] },
   *     ...
   *   ]
   * }
   */
  static async enterGradebook({ MaLop, MaHocKy, MaMon, scores }) {
    if (MaLop == null || MaHocKy == null || MaMon == null) throw { status: 400, message: "MaLop/MaHocKy/MaMon are required" };
    if (!Array.isArray(scores)) throw { status: 400, message: "scores must be array" };

    return await sequelize.transaction(async (t) => {
      // 1) ensure BangDiemMon exists
      let bdm = await BangDiemMon.findOne({ where: { MaLop, MaHocKy, MaMon }, transaction: t });
      if (!bdm) bdm = await BangDiemMon.create({ MaLop, MaHocKy, MaMon }, { transaction: t });

      // 2) preload weights from LHKT
      const lhktList = await LoaiHinhKiemTra.findAll({ transaction: t });
      const weightMap = new Map(lhktList.map(x => [x.MaLHKT, Number(x.HeSo)]));

      // 3) preload THAMSO weights (category weights: mieng, 15p, 1tiet, giuaky, cuoiky)
      const lop = await Lop.findByPk(MaLop, { transaction: t });
      let thamSo = null;
      if (lop?.MaNamHoc) {
        thamSo = await ThamSo.findOne({ where: { MaNamHoc: lop.MaNamHoc }, transaction: t });
      }
      
      // helper: classify LHKT into category
      const classify = (ma, ten) => {
        const name = (ten || '').toLowerCase();
        if (name.includes('miệng') || name.includes('mieng')) return 'mieng';
        if (name.includes('15')) return '15p';
        if (name.includes('1 tiết') || name.includes('1t') || name.includes('tiết')) return '1tiet';
        if (name.includes('giữa') || name.includes('giuaki')) return 'giuaky';
        if (name.includes('cuối') || name.includes('cuoiki')) return 'cuoiky';
        if (Number(ma) === 1) return 'mieng';
        if (Number(ma) === 2) return '15p';
        if (Number(ma) === 3) return '1tiet';
        if (Number(ma) === 4) return 'giuaky';
        if (Number(ma) === 5) return 'cuoiky';
        return null;
      };

      // 4) upsert each student
      for (const s of scores) {
        const MaHocSinh = s.MaHocSinh;
        if (MaHocSinh == null) continue;

        let ct = await CTBangDiemMonHocSinh.findOne({
          where: { MaBangDiemMon: bdm.MaBangDiemMon, MaHocSinh },
          transaction: t,
        });
        if (!ct) {
          ct = await CTBangDiemMonHocSinh.create(
            { MaBangDiemMon: bdm.MaBangDiemMon, MaHocSinh, DiemTBMon: null },
            { transaction: t }
          );
        }

        // 5) upsert detail scores
        const details = Array.isArray(s.details) ? s.details : [];
        for (const d of details) {
          if (d.MaLHKT == null || d.Lan == null) continue;
          const existed = await CTBangDiemMonLHKT.findOne({
            where: { MaCTBangDiemMon: ct.MaCTBangDiemMon, MaLHKT: d.MaLHKT, Lan: d.Lan },
            transaction: t,
          });

          if (!existed) {
            await CTBangDiemMonLHKT.create(
              { MaCTBangDiemMon: ct.MaCTBangDiemMon, MaLHKT: d.MaLHKT, Lan: d.Lan, Diem: d.Diem ?? null },
              { transaction: t }
            );
          } else {
            await existed.update({ Diem: d.Diem ?? existed.Diem }, { transaction: t });
          }
        }

        // 6) compute DiemTBMon (weighted by LHKT, then by category if THAMSO weights exist)
        const all = await CTBangDiemMonLHKT.findAll({
          where: { MaCTBangDiemMon: ct.MaCTBangDiemMon },
          transaction: t,
        });

        // If THAMSO has category weights, compute by category first, then apply category weights
        if (thamSo && (thamSo.Heso_Mieng || thamSo.Heso_Chinh_15p || thamSo.Heso_Giua_ky || thamSo.Heso_Cuoi_ky)) {
          const categoryScores = {
            mieng: { sum: 0, wsum: 0 },
            '15p': { sum: 0, wsum: 0 },
            '1tiet': { sum: 0, wsum: 0 },
            giuaky: { sum: 0, wsum: 0 },
            cuoiky: { sum: 0, wsum: 0 },
          };

          for (const r of all) {
            const w = weightMap.get(r.MaLHKT) ?? 1;
            if (r.Diem == null) continue;

            const lhkt = lhktList.find(x => x.MaLHKT === r.MaLHKT);
            const cat = classify(r.MaLHKT, lhkt?.TenLHKT);
            if (cat && categoryScores[cat]) {
              categoryScores[cat].sum += Number(r.Diem) * w;
              categoryScores[cat].wsum += w;
            }
          }

          // Calculate category averages
          const catAvgs = {};
          for (const [cat, data] of Object.entries(categoryScores)) {
            catAvgs[cat] = data.wsum > 0 ? Number((data.sum / data.wsum).toFixed(2)) : null;
          }

          // Apply category weights from THAMSO
          const hesoMap = {
            mieng: thamSo.Heso_Mieng ?? 0,
            '15p': thamSo.Heso_Chinh_15p ?? 0,
            '1tiet': 0, // not usually weighted separately
            giuaky: thamSo.Heso_Giua_ky ?? 0,
            cuoiky: thamSo.Heso_Cuoi_ky ?? 0,
          };

          let totalSum = 0, totalWsum = 0;
          for (const [cat, avg] of Object.entries(catAvgs)) {
            if (avg != null) {
              totalSum += avg * hesoMap[cat];
              totalWsum += hesoMap[cat];
            }
          }
          const DiemTBMon = totalWsum > 0 ? Number((totalSum / totalWsum).toFixed(2)) : null;
          await ct.update({ DiemTBMon }, { transaction: t });
        } else {
          // Default: weight by LHKT only
          let sum = 0, wsum = 0;
          for (const r of all) {
            const w = weightMap.get(r.MaLHKT) ?? 1;
            if (r.Diem == null) continue;
            sum += Number(r.Diem) * w;
            wsum += w;
          }
          const DiemTBMon = wsum > 0 ? Number((sum / wsum).toFixed(2)) : null;
          await ct.update({ DiemTBMon }, { transaction: t });
        }
      }

      // 7) cập nhật DiemTBHK cho từng học sinh trong lớp/học kỳ (gộp theo hệ số môn)
      await this.recalculateSemesterAverages({ MaLop, MaHocKy }, t);

      return { ok: true, MaBangDiemMon: bdm.MaBangDiemMon };
    });
  }

  static async recalculateSemesterAverages({ MaLop, MaHocKy }, transaction) {
    // lấy tất cả bảng điểm môn của lớp/học kỳ
    const bdms = await BangDiemMon.findAll({ where: { MaLop, MaHocKy }, transaction });
    if (bdms.length === 0) return;

    const monIds = bdms.map(x => x.MaMon);
    const monList = await MonHoc.findAll({ where: { MaMonHoc: { [Op.in]: monIds } }, transaction });
    const monHeSo = new Map(monList.map(m => [m.MaMonHoc, Number(m.HeSoMon)]));

    // lấy chi tiết điểm TB môn theo học sinh
    const ctList = await CTBangDiemMonHocSinh.findAll({
      where: { MaBangDiemMon: { [Op.in]: bdms.map(b => b.MaBangDiemMon) } },
      transaction,
    });

    // group by MaHocSinh
    const acc = new Map(); // MaHocSinh -> {sum, wsum}
    for (const ct of ctList) {
      const bdm = bdms.find(b => b.MaBangDiemMon === ct.MaBangDiemMon);
      const w = monHeSo.get(bdm.MaMon) ?? 1;
      if (ct.DiemTBMon == null) continue;

      if (!acc.has(ct.MaHocSinh)) acc.set(ct.MaHocSinh, { sum: 0, wsum: 0 });
      const cur = acc.get(ct.MaHocSinh);
      cur.sum += Number(ct.DiemTBMon) * w;
      cur.wsum += w;
    }

    for (const [MaHocSinh, v] of acc.entries()) {
      const DiemTBHK = v.wsum > 0 ? Number((v.sum / v.wsum).toFixed(2)) : null;
      const hsLop = await HocSinhLop.findOne({ where: { MaLop, MaHocSinh, MaHocKy }, transaction });
      if (hsLop) await hsLop.update({ DiemTBHK }, { transaction });
    }
  }

  // ===== TRA CUU DIEM =====
  static async lookupScoresOfStudent({ MaHocSinh, MaHocKy = null, MaMon = null }) {
    // trả về điểm TB HK + chi tiết từng loại hình kiểm tra theo môn
    const whereEnroll = { MaHocSinh };
    if (MaHocKy != null) whereEnroll.MaHocKy = MaHocKy;

    const enrolls = await HocSinhLop.findAll({ where: whereEnroll, order: [["MaHocKy", "ASC"]] });

    // preload LoaiHinhKiemTra + helper map
    const lhktList = await LoaiHinhKiemTra.findAll();
    const lhktMap = new Map(lhktList.map((x) => [x.MaLHKT, x.TenLHKT]));

    const classify = (ma, ten) => {
      const name = (ten || '').toLowerCase();
      if (name.includes('miệng') || name.includes('mieng')) return 'mieng';
      if (name.includes('15')) return '15p';
      if (name.includes('1 tiết') || name.includes('1t') || name.includes('tiết')) return '1tiet';
      if (name.includes('giữa') || name.includes('giuaki')) return 'giuaky';
      if (name.includes('cuối') || name.includes('cuoiki')) return 'cuoiky';
      // fallback numeric mapping if TenLHKT không rõ
      if (Number(ma) === 1) return 'mieng';
      if (Number(ma) === 2) return '15p';
      if (Number(ma) === 3) return '1tiet';
      if (Number(ma) === 4) return 'giuaky';
      if (Number(ma) === 5) return 'cuoiky';
      return null;
    };

    const avg = (arr) => {
      const vals = arr.filter((x) => x != null && !Number.isNaN(Number(x))).map(Number);
      if (!vals.length) return null;
      return Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2));
    };

    const result = [];
    for (const e of enrolls) {
      const bdmWhere = { MaLop: e.MaLop, MaHocKy: e.MaHocKy };
      if (MaMon != null) bdmWhere.MaMon = MaMon;

      const bdms = await BangDiemMon.findAll({ where: bdmWhere });
      const monIds = bdms.map((b) => b.MaMon);
      const monList = monIds.length ? await MonHoc.findAll({ where: { MaMonHoc: { [Op.in]: monIds } } }) : [];
      const monMap = new Map(monList.map((m) => [m.MaMonHoc, m.TenMonHoc]));

      const monScores = [];
      for (const bdm of bdms) {
        const ct = await CTBangDiemMonHocSinh.findOne({
          where: { MaBangDiemMon: bdm.MaBangDiemMon, MaHocSinh },
        });

        const details = ct
          ? await CTBangDiemMonLHKT.findAll({ where: { MaCTBangDiemMon: ct.MaCTBangDiemMon } })
          : [];

        const enriched = details.map((d) => ({
          MaLHKT: d.MaLHKT,
          TenLHKT: lhktMap.get(d.MaLHKT) || null,
          Lan: d.Lan,
          Diem: d.Diem,
        }));

        const bucket = { mieng: [], '15p': [], '1tiet': [], giuaky: [], cuoiky: [] };
        for (const d of enriched) {
          const tag = classify(d.MaLHKT, d.TenLHKT);
          if (tag && d.Diem != null) bucket[tag].push(Number(d.Diem));
        }

        monScores.push({
          MaMon: bdm.MaMon,
          TenMonHoc: monMap.get(bdm.MaMon) || null,
          MaBangDiemMon: bdm.MaBangDiemMon,
          DiemTBMon: ct?.DiemTBMon ?? null,
          DiemMieng: avg(bucket.mieng),
          Diem15Phut: avg(bucket['15p']),
          Diem1Tiet: avg(bucket['1tiet']),
          DiemGiuaKy: avg(bucket.giuaky),
          DiemCuoiKy: avg(bucket.cuoiky),
          details: enriched,
        });
      }

      result.push({
        MaLop: e.MaLop,
        MaHocKy: e.MaHocKy,
        DiemTBHK: e.DiemTBHK ?? null,
        monScores,
      });
    }

    return result;
  }

  // ===== TRA CUU HOC SINH =====
  static async searchStudents({ q }) {
    if (!q) return [];
    return await HocSinh.findAll({
      where: {
        [Op.or]: [
          { HoTen: { [Op.like]: `%${q}%` } },
          { MaHocSinh: q },
          { Email: { [Op.like]: `%${q}%` } },
          { SDT: { [Op.like]: `%${q}%` } },
        ],
      },
      limit: 50,
    });
  }

  static async importStudentsFromRows({ MaLop, MaHocKy, rows = [] }) {
    if (!MaLop || !MaHocKy) throw { status: 400, message: "MaLop và MaHocKy là bắt buộc" };
    if (!Array.isArray(rows) || rows.length === 0) {
      throw { status: 400, message: "File không có dữ liệu" };
    }

    const errors = [];
    let imported = 0;

    for (let idx = 0; idx < rows.length; idx += 1) {
      const row = rows[idx] || {};
      const rowNumber = idx + 2; // header row assumed at 1

      // Support multiple column name aliases
      const MaHocSinh = String(pickField(row, ["Mã học sinh", "MaHocSinh", "MaHS", "StudentId", "StudentCode", "Ma hoc sinh"]) || "").trim();
      const HoTen = pickField(row, ["Họ và tên", "HoTen", "HoVaTen", "FullName", "Ho va ten"]);
      const GioiTinh = normalizeGender(pickField(row, ["Giới tính", "GioiTinh", "Gender"]) || "Nam");
      const NgaySinh = normalizeDateOnly(pickField(row, ["Ngày sinh", "NgaySinh", "BirthDate", "Ngay Sinh", "Ngay sinh"]));
      const Email = pickField(row, ["Email", "Mail", "DiaChiEmail", "email"]);
      const SDT = pickField(row, ["Số điện thoại", "SDT", "SoDienThoai", "Phone", "SoDT", "So dien thoai", "so dien thoai"]);
      const DiaChi = pickField(row, ["Địa chỉ", "DiaChi", "Address", "Dia chi"]);
      const NgayTiepNhan = normalizeDateOnly(pickField(row, ["Ngày tiếp nhận", "NgayTiepNhan", "Ngay Tiep Nhan", "AdmissionDate", "Ngay tiep nhan"]));

      if (!MaHocSinh || !HoTen || !NgaySinh) {
        errors.push({ row: rowNumber, message: "Thiếu Mã học sinh/Họ và tên/Ngày sinh" });
        continue;
      }

      try {
        await this.addStudentToClass({
          MaLop,
          MaHocKy,
          student: {
            MaHocSinh,
            HoTen,
            GioiTinh,
            NgaySinh,
            Email,
            SDT,
            DiaChi,
            NgayTiepNhan,
          },
        });
        imported += 1;
      } catch (err) {
        const message = err?.message || err?.msg || "Lỗi không xác định";
        errors.push({ row: rowNumber, message });
      }
    }

    return {
      total: rows.length,
      imported,
      failed: errors.length,
      errors,
    };
  }

  static async importGrades({ MaLop, MaMon, MaHocKy, file }) {
    if (!file || !file.buffer) throw { status: 400, message: "File không hợp lệ" };

    try {
      // Parse spreadsheet
      // Disable date parsing to avoid converting numeric scores to dates (e.g., 8 -> 1900-01-08)
      const rows = parseSpreadsheet(file.buffer, { parseDates: false });
      
      // Column mapping
      const pickField = (row, aliases) => {
        for (const alias of aliases) {
          const key = Object.keys(row).find(k => k.toLowerCase() === alias.toLowerCase());
          if (key) return row[key];
        }
        return undefined;
      };

      const normalizeMultiScores = (val) => {
        if (val == null) return '';
        const s = String(val).trim();
        if (!s) return '';
        const nums = s
          .split(/[;,]/)
          .map((p) => p.trim().replace(/\s+/g, ''))
          .map((p) => Number(p.replace(',', '.')))
          .filter((n) => Number.isFinite(n));
        return nums.map((n) => Number(n.toFixed(2))).join(', ');
      };

      const normalizeSingleScore = (val) => {
        if (val == null) return '';
        const s = String(val).trim();
        if (!s) return '';
        // take the first numeric token found
        const match = s.split(/[;,\s]/)
          .map((p) => p.trim())
          .map((p) => Number(p.replace(',', '.')))
          .find((n) => Number.isFinite(n));
        return match != null ? String(Number(match.toFixed(2))) : '';
      };

      // Process rows
      const grades = [];
      for (const row of rows) {
        try {
          const MaHocSinh = pickField(row, ['MaHocSinh', 'Mã HS', 'Mã học sinh', 'MaHS']);
          const mieng15Phut = pickField(row, ['DiemMieng15', "Điểm Miệng/15'", 'Điểm Miệng/15Phut', 'DiemMieng15Phut']);
          const mot1Tiet = pickField(row, ['Diem1Tiet', 'Điểm 1 Tiết', 'Diem1Tiet']);
          const giuaKy = pickField(row, ['DiemGiuaky', 'Điểm Giữa kỳ', 'DiemGiuaKy']);
          const cuoiKy = pickField(row, ['DiemCuoiky', 'Điểm Cuối kỳ', 'DiemCuoiKy']);

          if (!MaHocSinh) continue;

          grades.push({
            MaHocSinh,
            HoTen: pickField(row, ['HoTen', 'Họ và tên', 'HoVaTen']) || '',
            scores: {
              mieng15Phut: normalizeMultiScores(mieng15Phut),
              mot1Tiet: normalizeMultiScores(mot1Tiet),
              giuaKy: normalizeSingleScore(giuaKy),
              cuoiKy: normalizeSingleScore(cuoiKy)
            },
            average: null
          });
        } catch (err) {
          // Skip invalid rows
        }
      }

      return { grades };
    } catch (err) {
      throw { status: 400, message: "Lỗi khi đọc file: " + (err.message || "Unknown error") };
    }
  }

  // GET gradebook for a class/subject/semester to load saved grades
  static async getGradebookByClassSubjectSemester({ MaLop, MaMon, MaHocKy }) {
    if (MaLop == null || MaMon == null || MaHocKy == null) {
      throw { status: 400, message: "MaLop/MaMon/MaHocKy are required" };
    }

    try {
      // Find the BangDiemMon record
      const bdm = await BangDiemMon.findOne({
        where: { MaLop, MaMon, MaHocKy }
      });

      if (!bdm) {
        return { grades: [] };
      }

      // Get all student entries for this BangDiemMon
      const ctList = await CTBangDiemMonHocSinh.findAll({
        where: { MaBangDiemMon: bdm.MaBangDiemMon },
        include: [
          {
            model: HocSinh,
            attributes: ['MaHocSinh', 'HoTen'],
            required: false
          }
        ]
      });

      // For each student, get their detailed scores
      const grades = [];
      for (const ct of ctList) {
        const details = await CTBangDiemMonLHKT.findAll({
          where: { MaCTBangDiemMon: ct.MaCTBangDiemMon }
        });

        // Get the LHKT info for each detail score
        const lhktList = await LoaiHinhKiemTra.findAll();
        
        // Group details by LHKT to reconstruct the scores format
        const scoresByLHKT = {};
        for (const detail of details) {
          if (!scoresByLHKT[detail.MaLHKT]) {
            scoresByLHKT[detail.MaLHKT] = [];
          }
          if (detail.Diem != null) {
            scoresByLHKT[detail.MaLHKT].push(detail.Diem);
          }
        }

        // Get the student name
        let hoTen = '';
        if (ct.HocSinh) {
          hoTen = ct.HocSinh.HoTen || '';
        } else {
          const hs = await HocSinh.findByPk(ct.MaHocSinh);
          hoTen = hs?.HoTen || '';
        }

        // Classify LHKT and map to score fields
        const classifyLHKT = (maLHKT, tenLHKT = '') => {
          const name = (tenLHKT || '').toLowerCase();
          if (name.includes('miệng') || name.includes('mieng')) return 'mieng15Phut';
          if (name.includes('15')) return 'mieng15Phut';
          if (name.includes('1 tiết') || name.includes('1t') || name.includes('tiết')) return 'mot1Tiet';
          if (name.includes('giữa') || name.includes('giuaki')) return 'giuaKy';
          if (name.includes('cuối') || name.includes('cuoiki')) return 'cuoiKy';
          if (Number(maLHKT) === 1) return 'mieng15Phut';
          if (Number(maLHKT) === 2) return 'mot1Tiet';
          if (Number(maLHKT) === 3) return 'giuaKy';
          if (Number(maLHKT) === 4) return 'cuoiKy';
          return null;
        };

        const scores = {
          mieng15Phut: '',
          mot1Tiet: '',
          giuaKy: '',
          cuoiKy: ''
        };

        for (const [maLHKT, scoreArray] of Object.entries(scoresByLHKT)) {
          const lhkt = lhktList.find(x => x.MaLHKT == maLHKT);
          const fieldName = classifyLHKT(maLHKT, lhkt?.TenLHKT);
          
          if (fieldName && scoreArray.length > 0) {
            scores[fieldName] = scoreArray.map(s => Number(s).toFixed(1)).join(', ');
          }
        }

        grades.push({
          MaHocSinh: ct.MaHocSinh,
          HoTen: hoTen,
          scores,
          average: ct.DiemTBMon
        });
      }

      return { grades };
    } catch (err) {
      console.error('[getGradebookByClassSubjectSemester] Error:', err);
      throw { status: 500, message: "Lỗi khi tải bảng điểm: " + (err.message || "Unknown error") };
    }
  }
}

