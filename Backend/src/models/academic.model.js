import { DataTypes } from "sequelize";
import  sequelize  from "../configs/sequelize.js";

export const HocKy = sequelize.define(
  "HOCKY",
  {
    MaHK: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenHK: { type: DataTypes.STRING(50), allowNull: false }
  },
  { tableName: "HOCKY", timestamps: false }
);

export const NamHoc = sequelize.define(
  "NAMHOC",
  {
    MaNH: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Nam1: { type: DataTypes.INTEGER, allowNull: false },
    Nam2: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "NAMHOC", timestamps: false }
);

export const KhoiLop = sequelize.define(
  "KHOILOP",
  {
    MaKL: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenKL: { type: DataTypes.STRING(50), allowNull: false },
    SoLop: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "KHOILOP", timestamps: false }
);

export const MonHoc = sequelize.define(
  "MONHOC",
  {
    MaMonHoc: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenMonHoc: { type: DataTypes.STRING(100), allowNull: false },
    MaMon: { type: DataTypes.STRING(50), allowNull: true },
    MoTa: { type: DataTypes.TEXT, allowNull: true },
    HeSoMon: { type: DataTypes.FLOAT, allowNull: false },
  },
  { tableName: "MONHOC", timestamps: false }
);

export const LoaiHinhKiemTra = sequelize.define(
  "LOAIHINHKIEMTRA",
  {
    MaLHKT: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenLHKT: { type: DataTypes.STRING(100), allowNull: false },
    HeSo: { type: DataTypes.FLOAT, allowNull: false },
  },
  { tableName: "LOAIHINHKIEMTRA", timestamps: false }
);
