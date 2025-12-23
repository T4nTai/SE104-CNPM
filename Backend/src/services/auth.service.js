import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../configs/env.js";
import  sequelize  from "../configs/sequelize.js";

import { NguoiDung, NhomNguoiDung, Quyen } from "../models/auth.model.js";
import { HocSinh } from "../models/student.model.js";

export class AuthService {
  static async login({ TenDangNhap, MatKhau }) {
    if (!TenDangNhap || !MatKhau) throw { status: 400, message: "Thiếu TenDangNhap hoặc MatKhau" };

    const user = await NguoiDung.findOne({
      where: { TenDangNhap },
      include: [{ model: NhomNguoiDung, as: "nhom" }],
    });
    if (!user) throw { status: 401, message: "Sai tài khoản hoặc mật khẩu" };

    const ok = await bcrypt.compare(MatKhau, user.MatKhau);
    if (!ok) throw { status: 401, message: "Sai tài khoản hoặc mật khẩu" };

    const role = String(user.nhom?.TenNhomNguoiDung || "").toLowerCase();

    const token = jwt.sign(
      {
        userId: user.MaNguoiDung,
        username: user.TenDangNhap,
        role,
        groupId: user.MaNhomNguoiDung,
        MaHocSinh: user.MaHocSinh || null, 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN || "7d" }
    );

    return {
      token,
      user: {
        MaNguoiDung: user.MaNguoiDung,
        TenDangNhap: user.TenDangNhap,
        HoVaTen: user.HoVaTen,
        Email: user.Email,
        role,
        MaNhomNguoiDung: user.MaNhomNguoiDung,
        MaHocSinh: user.MaHocSinh || null, 
      },
    };
  }

  static async registerRequest({ TenDangNhap, MatKhau, HoVaTen = null, Email = null }) {
    if (!TenDangNhap || !MatKhau) throw { status: 400, message: "Thiếu TenDangNhap hoặc MatKhau" };

    const existedUsername = await NguoiDung.findOne({ where: { TenDangNhap } });
    if (existedUsername) throw { status: 400, message: "TenDangNhap đã tồn tại" };

    // Default new registrations to the 'student' group
    let studentGroup = await NhomNguoiDung.findOne({ where: { TenNhomNguoiDung: "student" } });
    if (!studentGroup) {
      // fallback: create student group using first available Quyen
      const firstQuyen = await Quyen.findOne();
      studentGroup = await NhomNguoiDung.create({ TenNhomNguoiDung: "student", MaQuyen: firstQuyen ? firstQuyen.MaQuyen : 1 });
    }

    const hashed = await bcrypt.hash(MatKhau, 10);
    const user = await NguoiDung.create({
      TenDangNhap,
      MatKhau: hashed,
      HoVaTen,
      Email,
      MaNhomNguoiDung: studentGroup.MaNhomNguoiDung,
      MaHocSinh: null,
    });

    return {
      MaNguoiDung: user.MaNguoiDung,
      TenDangNhap: user.TenDangNhap,
      role: 'student',
      message: 'Tài khoản đã được tạo với vai trò học sinh. Vui lòng cập nhật thông tin học sinh nếu cần.'
    };
  }

  static async me(userId) {
    const user = await NguoiDung.findByPk(userId, {
      include: [{ model: NhomNguoiDung, as: "nhom" }],
      attributes: ["MaNguoiDung", "TenDangNhap", "HoVaTen", "Email", "MaNhomNguoiDung", "MaHocSinh"],
    });
    if (!user) throw { status: 401, message: "Token không hợp lệ" };

    return {
      ...user.toJSON(),
      role: String(user.nhom?.TenNhomNguoiDung || "").toLowerCase(),
    };
  }

  static async registerStudentAccount({
    TenDangNhap,
    MatKhau,
    HoVaTen = null,
    Email = null,
    MaHocSinh,
    HoTen,
    GioiTinh,
    NgaySinh,
    DiaChi = null,
    NgayTiepNhan = null,
    GhiChu = null,
  }) {
    if (!TenDangNhap || !MatKhau) throw { status: 400, message: "Thiếu TenDangNhap hoặc MatKhau" };
    if (!MaHocSinh) throw { status: 400, message: "MaHocSinh is required" };
    if (!HoTen || GioiTinh === undefined || GioiTinh === null || !NgaySinh)
    throw { status: 400, message: "Thiếu HoTen/GioiTinh/NgaySinh" };
  
    const existedUsername = await NguoiDung.findOne({ where: { TenDangNhap } });
    if (existedUsername) throw { status: 400, message: "TenDangNhap đã tồn tại" };

    const studentGroup = await NhomNguoiDung.findOne({ where: { TenNhomNguoiDung: "student" } });
    if (!studentGroup) throw { status: 500, message: "Chưa có nhóm 'student' trong NHOMNGUOIDUNG" };

    return await sequelize.transaction(async (t) => {
      let hs = await HocSinh.findByPk(MaHocSinh, { transaction: t });
      if (!hs) {
        hs = await HocSinh.create(
          { MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, NgayTiepNhan, GhiChu },
          { transaction: t }
        );
      }
      const existedAccountForStudent = await NguoiDung.findOne({ where: { MaHocSinh }, transaction: t });
      if (existedAccountForStudent) throw { status: 400, message: "Học sinh này đã có tài khoản" };
      const hashed = await bcrypt.hash(MatKhau, 10);
      const user = await NguoiDung.create(
        {
          TenDangNhap,
          MatKhau: hashed,
          HoVaTen: HoVaTen || HoTen,
          Email,
          MaNhomNguoiDung: studentGroup.MaNhomNguoiDung,
          MaHocSinh,
        },
        { transaction: t }
      );

      return {
        MaNguoiDung: user.MaNguoiDung,
        TenDangNhap: user.TenDangNhap,
        role: "student",
        MaHocSinh,
      };
    });
  }
  static async registerUserAccount({
    TenDangNhap,
    MatKhau,
    HoVaTen = null,
    Email = null,
    role, 
    }) {
    if (!TenDangNhap || !MatKhau) throw { status: 400, message: "Thiếu TenDangNhap hoặc MatKhau" };

    const r = String(role || "").toLowerCase();
    if (!["teacher", "admin"].includes(r)) {
    throw { status: 400, message: "role must be 'teacher' or 'admin'" };
        }

    const existedUsername = await NguoiDung.findOne({ where: { TenDangNhap } });
     if (existedUsername) throw { status: 400, message: "TenDangNhap đã tồn tại" };

    const group = await NhomNguoiDung.findOne({ where: { TenNhomNguoiDung: r } });
     if (!group) throw { status: 500, message: `Chưa có nhóm '${r}' trong NHOMNGUOIDUNG` };

    const hashed = await bcrypt.hash(MatKhau, 10);

     const user = await NguoiDung.create({
        TenDangNhap,
        MatKhau: hashed,
        HoVaTen,
        Email,
        MaNhomNguoiDung: group.MaNhomNguoiDung,
        MaHocSinh: null, 
        });

    return {
        MaNguoiDung: user.MaNguoiDung,
        TenDangNhap: user.TenDangNhap,
        role: r,
        };
    }
}
