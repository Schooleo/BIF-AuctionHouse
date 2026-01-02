import { Request, Response, NextFunction } from "express";
import passport from "../config/passport";
import { env } from "../config/env";

type UserRole = "bidder" | "seller" | "admin";

export const protect = (roles?: UserRole[]) => {
  return [
    // Xác thực người dùng bằng JWT
    passport.authenticate("jwt", { session: false }),

    // Kiểm tra vai trò người dùng
    (req: Request, res: Response, next: NextFunction) => {
      if (!roles || roles.length === 0) return next();

      const user = req.user as { role: UserRole };

      if (!user || !roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient permissions" });
      }

      next();
    },
  ];
};

export const googleAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "google",
    { session: false },
    (err: any, user: any, info: any) => {
      if (err || !user) {
        // Ưu tiên tin nhắn từ info (do Passport trả về) hoặc err
        const errorMessage =
          info && info.message
            ? info.message
            : err
            ? err.message
            : "LoginFailed";

        return res.redirect(
          `${env.FRONTEND_URL}/auth/login?error=${encodeURIComponent(
            errorMessage
          )}`
        );
      }
      req.user = user;
      next();
    }
  )(req, res, next);
};
