import { DataTypes } from "sequelize";
import  sequelize  from "../configs/sequelize.js";

export const Quyen = sequelize.define(
  "QUYEN",
  {
    MaQuyen: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    PhanQuyenHeThong: { type: DataTypes.TINYINT, allowNull: true },
    ThayDoiThamSo: { type: DataTypes.TINYINT, allowNull: true },
    ThayDoiQuyDinh: { type: DataTypes.TINYINT, allowNull: true },
    DieuChinhNghiepVu: { type: DataTypes.TINYINT, allowNull: true },
    TraCuuDiemVaLopHoc: { type: DataTypes.TINYINT, allowNull: true },
    TraCuuHocSinh: { type: DataTypes.TINYINT, allowNull: true },
  },
  { tableName: "QUYEN", timestamps: false }
);

export const NhomNguoiDung = sequelize.define(
  "NHOMNGUOIDUNG",
  {
    MaNhomNguoiDung: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenNhomNguoiDung: { type: DataTypes.STRING(100), allowNull: true },
    MaQuyen: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "NHOMNGUOIDUNG", timestamps: false }
);

export const NguoiDung = sequelize.define(
  "NGUOIDUNG",
  {
    MaNguoiDung: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenDangNhap: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    MatKhau: { type: DataTypes.STRING(255), allowNull: false },
    HoVaTen: DataTypes.STRING(100),
    Email: DataTypes.STRING(100),
    MaNhomNguoiDung: { type: DataTypes.INTEGER, allowNull: false },
    MaHocSinh: { type: DataTypes.STRING(100), allowNull: true },
  },
  { tableName: "NGUOIDUNG", timestamps: false }
);

