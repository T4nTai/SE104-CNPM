import { DataTypes } from "sequelize";
import  sequelize  from "../configs/sequelize.js";

export const ThamSo = sequelize.define(
  "THAMSO",
  {
    MaThamSo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TuoiToiDa: { type: DataTypes.INTEGER, allowNull: true },
    TuoiToiThieu: { type: DataTypes.INTEGER, allowNull: true },
    SiSoToiDa: { type: DataTypes.INTEGER, allowNull: true },
    DiemToiThieu: { type: DataTypes.INTEGER, allowNull: true },
    DiemToiDa: { type: DataTypes.INTEGER, allowNull: true },
    DiemDatMon: { type: DataTypes.INTEGER, allowNull: true },
    DiemDat: { type: DataTypes.INTEGER, allowNull: true },
    MaNamHoc: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "THAMSO", timestamps: false }
);
