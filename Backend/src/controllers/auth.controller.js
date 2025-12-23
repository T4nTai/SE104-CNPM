import { AuthService } from "../services/auth.service.js";

export class AuthController {
  static async login(req, res, next) {
    try {
      const data = await AuthService.login(req.body);
      res.json({ data });
    } catch (e) { next(e); }
  }

  static async me(req, res, next) {
    try {
      const data = await AuthService.me(req.user.userId);
      res.json({ data });
    } catch (e) { next(e); }
  }


  static async registerStudent(req, res, next) {
    try {
      const data = await AuthService.registerStudentAccount(req.body);
      res.status(201).json({ data });
    } catch (e) { next(e); }
  }
  static async registerUser(req, res, next) {
    try {
        const data = await AuthService.registerUserAccount(req.body);
        res.status(201).json({ data });
    } catch (e) {
     next(e);
    }
    }
  static async registerRequest(req, res, next) {
    try {
      const data = await AuthService.registerRequest(req.body);
      res.status(201).json({ data });
    } catch (e) { next(e); }
  }
}
