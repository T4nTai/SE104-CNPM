import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const ReportRoute = Router();

// Report routes cần JWT authentication (cho teacher và admin)
ReportRoute.use(authenticateJWT);

ReportRoute.get("/semester-class", ReportController.reportBySemesterAndClass);
ReportRoute.get("/subject", ReportController.reportBySubject);

export default ReportRoute;
