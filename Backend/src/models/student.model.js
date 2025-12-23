import { DataTypes } from "sequelize";
import  sequelize from "../configs/sequelize.js";

export const HocSinh = sequelize.define(
  "HOCSINH",
  {
    MaHocSinh: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      autoIncrement: false, 
      allowNull: false,
    },
    HoTen: { type: DataTypes.STRING(100), allowNull: false },
    NgaySinh: { type: DataTypes.DATEONLY, allowNull: false },
    GioiTinh: { type: DataTypes.STRING(10), allowNull: false },
    Email: { type: DataTypes.STRING(100), allowNull: true },
    SDT: { type: DataTypes.STRING(20), allowNull: true },
    DiaChi: { type: DataTypes.STRING(255), allowNull: true },
    NgayTiepNhan: { type: DataTypes.DATEONLY, allowNull: true },
    GhiChu: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: "HOCSINH", timestamps: false }
);

export const Lop = sequelize.define(
  "LOP",
  {
    MaLop: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenLop: { type: DataTypes.STRING(50), allowNull: false },
    MaKhoiLop: { type: DataTypes.INTEGER, allowNull: false },
    MaNamHoc: { type: DataTypes.INTEGER, allowNull: false },
    SiSo: { type: DataTypes.INTEGER, allowNull: true },
    MaGVCN: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "LOP", timestamps: false }
);

export const HocSinhLop = sequelize.define(
  "HOCSINH_LOP",
  {
    MaLop: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    MaHocSinh: { type: DataTypes.STRING(100), primaryKey: true, allowNull: false },
    MaHocKy: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    DiemTBHK: { type: DataTypes.FLOAT, allowNull: true },
  },
  { tableName: "HOCSINH_LOP", timestamps: false }
);
