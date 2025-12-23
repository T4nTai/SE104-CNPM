import { StudentService } from "../services/student.service.js";

export class StudentController {
  static async meClasses(req, res, next) {
    try {
      const MaHocSinh = req.user?.MaHocSinh;
      if (!MaHocSinh) {
        // If account not linked to a student record, return empty list instead of 403
        return res.json({ data: [] });
      }

      const data = await StudentService.getMyClasses({
        MaHocSinh,
        MaHocKy: req.query.MaHocKy ? Number(req.query.MaHocKy) : null,
      });
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async meScores(req, res, next) {
    try {
      const MaHocSinh = req.user?.MaHocSinh;
      if (!MaHocSinh) {
        return res.json({ data: [] });
      }

      const { MaHocKy } = req.query;
      if (!MaHocKy) throw { status: 400, message: "MaHocKy is required" };

      const data = await StudentService.getMyScoresBySemester({
        MaHocSinh,
        MaHocKy: Number(MaHocKy),
      });
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async classDetails(req, res, next) {
    try {
      const MaHocSinh = req.user?.MaHocSinh;
      if (!MaHocSinh) {
        return res.json({ data: { classmates: [], classInfo: null } });
      }

      const { MaLop, MaHocKy } = req.params;
      const data = await StudentService.getClassDetails({
        MaHocSinh,
        MaLop: Number(MaLop),
        MaHocKy: Number(MaHocKy),
      });
      res.json({ data });
    } catch (e) { next(e); }
  }
}
