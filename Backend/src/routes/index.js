import { Router } from "express";
import AdminRoute from "./admin.route.js";
import TeacherRoute from "./teacher.route.js";
import ReportRoute from "./report.route.js";
import StudentRoute from "./student.route.js";
import AuthRoute from "./auth.route.js";

const router = Router();

router.use("/admin", AdminRoute);
router.use("/teacher", TeacherRoute);
router.use("/reports", ReportRoute);
router.use("/auth", AuthRoute);
router.use("/", StudentRoute);

export default router;
