import { HocKy, NamHoc, KhoiLop, MonHoc, LoaiHinhKiemTra } from "./academic.model.js";
import { HocSinh, Lop, HocSinhLop } from "./student.model.js";
import { BangDiemMon, CTBangDiemMonHocSinh, CTBangDiemMonLHKT } from "./gradebook.model.js";
import { BaoCaoTKMon, CTBaoCaoTKMon, BaoCaoTKHK } from "./report.model.js";
import { Quyen, NhomNguoiDung, NguoiDung } from "./auth.model.js";
import { ThamSo } from "./config.model.js";

export function initAssociations() {
  // LOP -> KHOILOP, NAMHOC
  Lop.belongsTo(KhoiLop, { foreignKey: "MaKhoiLop", as: "KhoiLop" });
  Lop.belongsTo(NamHoc, { foreignKey: "MaNamHoc", as: "NamHoc" });
  KhoiLop.hasMany(Lop, { foreignKey: "MaKhoiLop" });
  NamHoc.hasMany(Lop, { foreignKey: "MaNamHoc" });

  // HOCSINH_LOP -> LOP, HOCSINH, HOCKY
  HocSinhLop.belongsTo(Lop, { foreignKey: "MaLop", as: "Lop" });
  HocSinhLop.belongsTo(HocSinh, { foreignKey: "MaHocSinh", as: "HocSinh" });
  HocSinhLop.belongsTo(HocKy, { foreignKey: "MaHocKy", as: "HocKy" });

  Lop.hasMany(HocSinhLop, { foreignKey: "MaLop" });
  HocSinh.hasMany(HocSinhLop, { foreignKey: "MaHocSinh" });
  HocKy.hasMany(HocSinhLop, { foreignKey: "MaHocKy" });

  // BANGDIEMMON -> LOP, HOCKY, MONHOC
  BangDiemMon.belongsTo(Lop, { foreignKey: "MaLop" });
  BangDiemMon.belongsTo(HocKy, { foreignKey: "MaHocKy" });
  BangDiemMon.belongsTo(MonHoc, { foreignKey: "MaMon" });

  Lop.hasMany(BangDiemMon, { foreignKey: "MaLop" });
  HocKy.hasMany(BangDiemMon, { foreignKey: "MaHocKy" });
  MonHoc.hasMany(BangDiemMon, { foreignKey: "MaMon" });

  // Gán giáo viên bộ môn cho BANGDIEMMON
  BangDiemMon.belongsTo(NguoiDung, { foreignKey: "MaGV", as: "GVMon" });
  NguoiDung.hasMany(BangDiemMon, { foreignKey: "MaGV", as: "bangDiemMonGiangDay" });

  // CT_BANGDIEMMON_HOCSINH -> BANGDIEMMON, HOCSINH
  CTBangDiemMonHocSinh.belongsTo(BangDiemMon, { foreignKey: "MaBangDiemMon" });
  CTBangDiemMonHocSinh.belongsTo(HocSinh, { foreignKey: "MaHocSinh" });

  BangDiemMon.hasMany(CTBangDiemMonHocSinh, { foreignKey: "MaBangDiemMon" });
  HocSinh.hasMany(CTBangDiemMonHocSinh, { foreignKey: "MaHocSinh" });

  // CT_BANGDIEMMON_LHKT -> CT_BANGDIEMMON_HOCSINH, LOAIHINHKIEMTRA
  CTBangDiemMonLHKT.belongsTo(CTBangDiemMonHocSinh, { foreignKey: "MaCTBangDiemMon" });
  CTBangDiemMonLHKT.belongsTo(LoaiHinhKiemTra, { foreignKey: "MaLHKT" });

  CTBangDiemMonHocSinh.hasMany(CTBangDiemMonLHKT, { foreignKey: "MaCTBangDiemMon" });
  LoaiHinhKiemTra.hasMany(CTBangDiemMonLHKT, { foreignKey: "MaLHKT" });

  // BAOCAOTKMON -> MONHOC, HOCKY, NAMHOC
  BaoCaoTKMon.belongsTo(MonHoc, { foreignKey: "MaMon" });
  BaoCaoTKMon.belongsTo(HocKy, { foreignKey: "MaHocKy" });
  BaoCaoTKMon.belongsTo(NamHoc, { foreignKey: "MaNamHoc" });

  MonHoc.hasMany(BaoCaoTKMon, { foreignKey: "MaMon" });
  HocKy.hasMany(BaoCaoTKMon, { foreignKey: "MaHocKy" });
  NamHoc.hasMany(BaoCaoTKMon, { foreignKey: "MaNamHoc" });

  // CT_BAOCAOTKMON -> BAOCAOTKMON, LOP
  CTBaoCaoTKMon.belongsTo(BaoCaoTKMon, { foreignKey: "MaBCTKMon" });
  CTBaoCaoTKMon.belongsTo(Lop, { foreignKey: "MaLop" });

  BaoCaoTKMon.hasMany(CTBaoCaoTKMon, { foreignKey: "MaBCTKMon" });
  Lop.hasMany(CTBaoCaoTKMon, { foreignKey: "MaLop" });

  // BAOCAOTKHK -> HOCKY, NAMHOC, LOP
  BaoCaoTKHK.belongsTo(HocKy, { foreignKey: "MaHocKy" });
  BaoCaoTKHK.belongsTo(NamHoc, { foreignKey: "MaNamHoc" });
  BaoCaoTKHK.belongsTo(Lop, { foreignKey: "MaLop" });

  HocKy.hasMany(BaoCaoTKHK, { foreignKey: "MaHocKy" });
  NamHoc.hasMany(BaoCaoTKHK, { foreignKey: "MaNamHoc" });
  Lop.hasMany(BaoCaoTKHK, { foreignKey: "MaLop" });

  // NHOMNGUOIDUNG -> QUYEN
  NhomNguoiDung.belongsTo(Quyen, { foreignKey: "MaQuyen", as: "quyen" });
  Quyen.hasMany(NhomNguoiDung, { foreignKey: "MaQuyen", as: "nhoms" });

// NGUOIDUNG -> NHOMNGUOIDUNG
  NguoiDung.belongsTo(NhomNguoiDung, { foreignKey: "MaNhomNguoiDung", as: "nhom" });
  NhomNguoiDung.hasMany(NguoiDung, { foreignKey: "MaNhomNguoiDung", as: "users" });

  // THAMSO -> NAMHOC
  NamHoc.hasOne(ThamSo, { foreignKey: "MaNamHoc", sourceKey: "MaNH", as: "thamSo" });
  ThamSo.belongsTo(NamHoc, { foreignKey: "MaNamHoc", targetKey: "MaNH", as: "namHoc" });

  // Removed HocKy <-> NamHoc association because MaNamHoc column is no longer used

  // NGUOIDUNG -> HOCSINH
  NguoiDung.belongsTo(HocSinh, { foreignKey: "MaHocSinh", targetKey: "MaHocSinh", as: "hocSinh" });
  HocSinh.hasOne(NguoiDung, { foreignKey: "MaHocSinh", sourceKey: "MaHocSinh", as: "nguoiDung" });

  // LOP -> NGUOIDUNG (Giáo viên chủ nhiệm)
  Lop.belongsTo(NguoiDung, { foreignKey: "MaGVCN", as: "GVCN" });
  NguoiDung.hasMany(Lop, { foreignKey: "MaGVCN", as: "lopChuNhiem" });
}
