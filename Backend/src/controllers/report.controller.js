import { ReportService } from "../services/report.service.js";

export class ReportController {
  // GET /reports/semester-class?MaHocKy=&MaNamHoc=&MaLop=
  static async reportBySemesterAndClass(req, res, next) {
    try {
      const { MaHocKy, MaNamHoc, MaLop } = req.query;
      if (!MaHocKy || !MaNamHoc || !MaLop) throw { status: 400, message: "MaHocKy, MaNamHoc, MaLop are required" };

      const data = await ReportService.reportBySemesterAndClass({
        MaHocKy: Number(MaHocKy),
        MaNamHoc: Number(MaNamHoc),
        MaLop: Number(MaLop),
      });
      res.json({ data });
    } catch (e) { next(e); }
  }

  // GET /reports/subject?MaMon=&MaHocKy=&MaNamHoc=
  static async reportBySubject(req, res, next) {
    try {
      const { MaMon, MaHocKy, MaNamHoc } = req.query;
      if (!MaMon || !MaHocKy || !MaNamHoc) throw { status: 400, message: "MaMon, MaHocKy, MaNamHoc are required" };

      const data = await ReportService.reportBySubject({
        MaMon: Number(MaMon),
        MaHocKy: Number(MaHocKy),
        MaNamHoc: Number(MaNamHoc),
      });
      res.json({ data });
    } catch (e) { next(e); }
  }
}
