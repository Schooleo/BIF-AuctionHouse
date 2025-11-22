import { Request, Response, NextFunction } from "express";
import passport from "../config/passport";

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
