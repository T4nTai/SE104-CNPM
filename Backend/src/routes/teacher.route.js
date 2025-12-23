import { Router } from "express";
import { TeacherController } from "../controllers/teacher.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const TeacherRoute = Router();

// Tất cả routes của teacher cần JWT authentication
TeacherRoute.use(authenticateJWT);

TeacherRoute.get("/assignments", TeacherController.listAssignments);
TeacherRoute.get("/classes", TeacherController.listClasses);
TeacherRoute.get("/classes/:MaLop/semesters/:MaHocKy/students", TeacherController.getStudentsByClass);

TeacherRoute.post("/classes/:MaLop/semesters/:MaHocKy/students", TeacherController.addStudentToClass);
TeacherRoute.post("/classes/:MaLop/semesters/:MaHocKy/students/import", upload.single("file"), TeacherController.importStudents);

TeacherRoute.put("/students/:MaHocSinh", TeacherController.updateStudent);
TeacherRoute.patch("/students/:MaHocSinh", TeacherController.updateStudent);
TeacherRoute.delete("/students/:MaHocSinh", TeacherController.deleteStudent);

TeacherRoute.post("/gradebooks/enter", TeacherController.enterGradebook);
TeacherRoute.post("/classes/:MaLop/subjects/:MaMon/semesters/:MaHocKy/import-grades", upload.single("file"), TeacherController.importGrades);

TeacherRoute.get("/students/:MaHocSinh/scores", TeacherController.lookupScoresOfStudent);
TeacherRoute.get("/students/search", TeacherController.searchStudents);

export default TeacherRoute;
