import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticateJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const AuthRoute = Router();

AuthRoute.post("/login", AuthController.login);
AuthRoute.get("/me", authenticateJWT, AuthController.me);
AuthRoute.post("/register-student", AuthController.registerStudent);
AuthRoute.post( "/register-user", AuthController.registerUser);
AuthRoute.post("/register-request", AuthController.registerRequest);
export default AuthRoute;
