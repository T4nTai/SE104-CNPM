import { TeacherService } from "../services/teacher.service.js";
import { sendAccountCreationEmail } from "../ultis/email.js";
import { parseSpreadsheet } from "../ultis/spreadsheet.js";

export class TeacherController {
  static async listAssignments(req, res, next) {
    try {
      const MaGV = req.query.MaGV ? Number(req.query.MaGV) : (req.user?.userId || null);
      console.log('[listAssignments] Request for MaGV:', MaGV);
      
      const data = await TeacherService.listAssignmentsForTeacher({ MaGV });
      
      console.log('[listAssignments] Returning data:', {
        homeroomCount: data.homeroom?.length || 0,
        subjectCount: data.subject?.length || 0
      });
      
      res.json({ data });
    } catch (e) { 
      console.error('[listAssignments] Error:', e);
      next(e); 
    }
  }

  static async listClasses(req, res, next) {
    try {
      // Get MaGV from JWT token (req.user.userId), or from query param for backward compatibility
      const MaGV = req.query.MaGV ? Number(req.query.MaGV) : (req.user?.userId || null);
      
      console.log('[listClasses] Request params:', {
        MaGV,
        MaNamHoc: req.query.MaNamHoc,
        MaKhoiLop: req.query.MaKhoiLop,
        MaHocKy: req.query.MaHocKy,
        userId: req.user?.userId
      });
      
      const rows = await TeacherService.listClasses({
        MaGV,
        MaNamHoc: req.query.MaNamHoc ? Number(req.query.MaNamHoc) : null,
        MaKhoiLop: req.query.MaKhoiLop ? Number(req.query.MaKhoiLop) : null,
        MaHocKy: req.query.MaHocKy ? Number(req.query.MaHocKy) : null,
      });
      
      console.log(`[listClasses] Found ${rows.length} classes for teacher ${MaGV}`);
      res.json({ data: rows });
    } catch (e) { 
      console.error('[listClasses] Error:', e);
      next(e); 
    }
  }

  static async getStudentsByClass(req, res, next) {
    try {
      const { MaLop, MaHocKy } = req.params;
      const students = await TeacherService.getStudentsByClass({
        MaLop: Number(MaLop),
        MaHocKy: Number(MaHocKy),
      });
      res.json({ data: students });
    } catch (e) { next(e); }
  }

  // POST /teacher/classes/:MaLop/semesters/:MaHocKy/students
  static async addStudentToClass(req, res, next) {
    try {
      const { MaLop, MaHocKy } = req.params;
      const row = await TeacherService.addStudentToClass({
        MaLop: Number(MaLop),
        MaHocKy: Number(MaHocKy),
        student: req.body,
      });
      // Send email with account credentials if a new account was created
      if (row?.createdAccount && row.createdAccount.Email) {
        const { Email, HoTen, TenDangNhap, tempPass } = row.createdAccount;
        // Fire-and-forget; do not block response
        sendAccountCreationEmail({
          email: Email,
          hoVaTen: HoTen,
          tenDangNhap: TenDangNhap,
          matKhau: tempPass,
          userType: "student",
        }).catch(() => {/* ignore email errors to not break the API */});
      }

      // Return both enroll info and createdAccount metadata for clients to show messages
      res.status(201).json({ data: row });
    } catch (e) { next(e); }
  }

  static async updateStudent(req, res, next) {
    try {
      const { MaHocSinh } = req.params;
      const row = await TeacherService.updateStudent(MaHocSinh, req.body);
      res.json({ data: row });
    } catch (e) { next(e); }
  }

  static async deleteStudent(req, res, next) {
    try {
      const { MaHocSinh } = req.params;
      const result = await TeacherService.deleteStudent(MaHocSinh);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // POST /teacher/gradebooks/enter
  static async enterGradebook(req, res, next) {
    try {
      const result = await TeacherService.enterGradebook(req.body);
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  static async importGrades(req, res, next) {
    try {
      const { MaLop, MaMon, MaHocKy } = req.params;
      if (!req.file) throw { status: 400, message: "File không được gửi" };
      
      const result = await TeacherService.importGrades({
        MaLop: Number(MaLop),
        MaMon: Number(MaMon),
        MaHocKy: Number(MaHocKy),
        file: req.file
      });
      
      res.json({ data: result });
    } catch (e) { next(e); }
  }

  // GET /teacher/students/:MaHocSinh/scores?MaHocKy=
  static async lookupScoresOfStudent(req, res, next) {
    try {
      const { MaHocSinh } = req.params;
      const data = await TeacherService.lookupScoresOfStudent({
        MaHocSinh,
        MaHocKy: req.query.MaHocKy ? Number(req.query.MaHocKy) : null,
        MaMon: req.query.MaMon ? Number(req.query.MaMon) : null,
      });
      res.json({ data });
    } catch (e) { next(e); }
  }

  // GET /teacher/students/search?q=...
  static async searchStudents(req, res, next) {
    try {
      const data = await TeacherService.searchStudents({ q: req.query.q });
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async importStudents(req, res, next) {
    try {
      const { MaLop, MaHocKy } = req.params;
      if (!req.file) throw { status: 400, message: "Vui lòng chọn file CSV/XLSX" };

      const rows = parseSpreadsheet(req.file.buffer);
      const result = await TeacherService.importStudentsFromRows({
        MaLop: Number(MaLop),
        MaHocKy: Number(MaHocKy),
        rows,
      });

      res.status(201).json({ data: result });
    } catch (e) { next(e); }
  }
}
