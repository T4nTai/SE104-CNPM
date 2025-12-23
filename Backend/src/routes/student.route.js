import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { StudentController } from "../controllers/student.controller.js";

const router = Router();

router.get("/students/me/classes", authenticateJWT, StudentController.meClasses);
router.get("/students/me/scores", authenticateJWT, StudentController.meScores);
router.get("/students/classes/:MaLop/semesters/:MaHocKy/details", authenticateJWT, StudentController.classDetails);

export default router;
