
import { Lop, HocSinhLop } from "../models/student.model.js";
import { MonHoc } from "../models/academic.model.js";
import { ThamSo } from "../models/config.model.js";
import { BangDiemMon, CTBangDiemMonHocSinh } from "../models/gradebook.model.js";

import { BaoCaoTKHK, BaoCaoTKMon, CTBaoCaoTKMon } from "../models/report.model.js";

export class ReportService {
  // ===== báo cáo HK theo lớp =====
  static async reportBySemesterAndClass({ MaHocKy, MaNamHoc, MaLop }) {
    const lop = await Lop.findByPk(MaLop);
    if (!lop) throw { status: 404, message: "Lop not found" };
    if (lop.MaNamHoc !== MaNamHoc) {
      // không bắt buộc, nhưng giúp đúng dữ liệu
    }

    const ts = await ThamSo.findOne({ where: { MaNamHoc } });
    const diemDatHK = ts?.Diem_Dat ?? 5;

    const enrolls = await HocSinhLop.findAll({ where: { MaLop, MaHocKy } });
    const total = enrolls.length;
    const soLuongDat = enrolls.filter(e => (e.DiemTBHK ?? -1) >= diemDatHK).length;
    const tiLeDat = total > 0 ? Number(((soLuongDat / total) * 100).toFixed(2)) : 0;

    // Phân loại theo mức: >=8 Xuất sắc, >=6.5 Giỏi, >=5 Trung bình, <5 Yếu
    const nums = enrolls.map(e => (e.DiemTBHK == null ? null : Number(e.DiemTBHK))).filter(v => v != null);
    const cat = { XuatSac: 0, Gioi: 0, TrungBinh: 0, Yeu: 0 };
    for (const v of nums) {
      if (v >= 8) cat.XuatSac += 1;
      else if (v >= 6.5) cat.Gioi += 1;
      else if (v >= 5) cat.TrungBinh += 1;
      else cat.Yeu += 1;
    }
    const avg = nums.length ? Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2)) : null;

    // lưu vào BAOCAOTKHK (PK composite)
    const existed = await BaoCaoTKHK.findOne({ where: { MaHocKy, MaNamHoc, MaLop } });
    if (!existed) {
      await BaoCaoTKHK.create({ MaHocKy, MaNamHoc, MaLop, SoLuongDat: soLuongDat, TiLeDat: tiLeDat });
    } else {
      await existed.update({ SoLuongDat: soLuongDat, TiLeDat: tiLeDat });
    }

    return {
      MaHocKy,
      MaNamHoc,
      MaLop,
      TongSoHocSinh: total,
      SoLuongDat: soLuongDat,
      TiLeDat: tiLeDat,
      PhanBo: cat,
      DiemTBHK_TB: avg,
    };
  }

  // ===== báo cáo theo môn (một môn, một HK, một năm học) =====
  static async reportBySubject({ MaMon, MaHocKy, MaNamHoc }) {
    const ts = await ThamSo.findOne({ where: { MaNamHoc } });
    const diemDatMon = ts?.Diem_Dat_Mon ?? 5;

    // tìm tất cả lớp của năm học
    const lops = await Lop.findAll({ where: { MaNamHoc } });

    // đảm bảo bản ghi BAOCAOTKMON
    let bc = await BaoCaoTKMon.findOne({ where: { MaMon, MaHocKy, MaNamHoc } });
    if (!bc) bc = await BaoCaoTKMon.create({ MaMon, MaHocKy, MaNamHoc });

    // tính theo từng lớp: số lượng đạt môn trong HK
    const details = [];
    let totalStudentsAll = 0;
    let totalPassedAll = 0;
    let sumAvgAll = 0;
    let countAvgAll = 0;
    const totalCat = { XuatSac: 0, Gioi: 0, TrungBinh: 0, Yeu: 0 };

    for (const lop of lops) {
      const bdm = await BangDiemMon.findOne({ where: { MaLop: lop.MaLop, MaHocKy, MaMon } });
      if (!bdm) continue;

      const cts = await CTBangDiemMonHocSinh.findAll({ where: { MaBangDiemMon: bdm.MaBangDiemMon } });
      const total = cts.length;
      const soLuongDat = cts.filter(x => (x.DiemTBMon ?? -1) >= diemDatMon).length;
      const tiLeDat = total > 0 ? Number(((soLuongDat / total) * 100).toFixed(2)) : 0;

      // per-class categories & average
      const nums = cts.map(x => (x.DiemTBMon == null ? null : Number(x.DiemTBMon))).filter(v => v != null);
      const cat = { XuatSac: 0, Gioi: 0, TrungBinh: 0, Yeu: 0 };
      for (const v of nums) {
        if (v >= 8) cat.XuatSac += 1; else if (v >= 6.5) cat.Gioi += 1; else if (v >= 5) cat.TrungBinh += 1; else cat.Yeu += 1;
      }
      const avg = nums.length ? Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2)) : null;

      details.push({
        MaLop: lop.MaLop,
        TenLop: lop.TenLop,
        TongSoHocSinh: total,
        SoLuongDat: soLuongDat,
        TiLeDat: tiLeDat,
        PhanBo: cat,
        DiemTBMon_TB: avg,
      });

      totalStudentsAll += total;
      totalPassedAll += soLuongDat;
      if (avg != null) { sumAvgAll += avg; countAvgAll += 1; }
      totalCat.XuatSac += cat.XuatSac; totalCat.Gioi += cat.Gioi; totalCat.TrungBinh += cat.TrungBinh; totalCat.Yeu += cat.Yeu;

      const existed = await CTBaoCaoTKMon.findOne({ where: { MaBCTKMon: bc.MaBCTKMon, MaLop: lop.MaLop } });
      if (!existed) {
        await CTBaoCaoTKMon.create({ MaBCTKMon: bc.MaBCTKMon, MaLop: lop.MaLop, SoLuongDat: soLuongDat, TiLeDat: tiLeDat });
      } else {
        await existed.update({ SoLuongDat: soLuongDat, TiLeDat: tiLeDat });
      }
    }

    const tongTiLeDat = totalStudentsAll > 0 ? Number(((totalPassedAll / totalStudentsAll) * 100).toFixed(2)) : 0;
    const tongDiemTB = countAvgAll > 0 ? Number((sumAvgAll / countAvgAll).toFixed(2)) : null;

    return {
      MaBCTKMon: bc.MaBCTKMon,
      MaMon,
      MaHocKy,
      MaNamHoc,
      TongSoHocSinh: totalStudentsAll,
      TongSoLuongDat: totalPassedAll,
      TongTiLeDat: tongTiLeDat,
      TongPhanBo: totalCat,
      DiemTBMon_TB: tongDiemTB,
      ChiTietTheoLop: details,
    };
  }
}
