import { DataTypes } from "sequelize";
import  sequelize  from "../configs/sequelize.js";

export const BangDiemMon = sequelize.define(
  "BANGDIEMMON",
  {
    MaBangDiemMon: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaLop: { type: DataTypes.INTEGER, allowNull: false },
    MaHocKy: { type: DataTypes.INTEGER, allowNull: false },
    MaMon: { type: DataTypes.INTEGER, allowNull: false },
    MaGV: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "BANGDIEMMON", timestamps: false }
);

export const CTBangDiemMonHocSinh = sequelize.define(
  "CT_BANGDIEMMON_HOCSINH",
  {
    MaCTBangDiemMon: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaBangDiemMon: { type: DataTypes.INTEGER, allowNull: false },
    MaHocSinh: { type: DataTypes.STRING(100), allowNull: false },
    DiemTBMon: { type: DataTypes.FLOAT, allowNull: true },
  },
  { tableName: "CT_BANGDIEMMON_HOCSINH", timestamps: false }
);


export const CTBangDiemMonLHKT = sequelize.define(
  "CT_BANGDIEMMON_LHKT",
  {
    MaCTBangDiemMon: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    MaLHKT: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    Lan: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    Diem: { type: DataTypes.FLOAT, allowNull: true },
  },
  { tableName: "CT_BANGDIEMMON_LHKT", timestamps: false }
);
