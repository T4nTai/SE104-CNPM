import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.js";

export const authenticateJWT = (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Access token is required" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            message: "Access token has expired",
            code: "TOKEN_EXPIRED",
          });
        }
        return res.status(401).json({ message: "Invalid token" });
      }

      req.user = decoded;
      next();
    });
  } catch (err) {
    next(err);
  }
};

export function authorizeRoles(...roles) {
  const allowed = roles.map(r => String(r).toLowerCase());

  return (req, res, next) => {
    const role = String(req.user?.role || "").toLowerCase();
    if (!role) return res.status(401).json({ message: "Unauthorized" });

    if (!allowed.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
