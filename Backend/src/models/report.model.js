import { DataTypes } from "sequelize";
import  sequelize  from "../configs/sequelize.js";

export const BaoCaoTKMon = sequelize.define(
  "BAOCAOTKMON",
  {
    MaBCTKMon: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaMon: { type: DataTypes.INTEGER, allowNull: false },
    MaHocKy: { type: DataTypes.INTEGER, allowNull: false },
    MaNamHoc: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "BAOCAOTKMON", timestamps: false }
);

export const CTBaoCaoTKMon = sequelize.define(
  "CT_BAOCAOTKMON",
  {
    MaBCTKMon: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    MaLop: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    SoLuongDat: { type: DataTypes.INTEGER, allowNull: true },
    TiLeDat: { type: DataTypes.FLOAT, allowNull: true },
  },
  { tableName: "CT_BAOCAOTKMON", timestamps: false }
);

export const BaoCaoTKHK = sequelize.define(
  "BAOCAOTKHK",
  {
    MaHocKy: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    MaNamHoc: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    MaLop: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    SoLuongDat: { type: DataTypes.INTEGER, allowNull: true },
    TiLeDat: { type: DataTypes.FLOAT, allowNull: true },
  },
  { tableName: "BAOCAOTKHK", timestamps: false }
);
