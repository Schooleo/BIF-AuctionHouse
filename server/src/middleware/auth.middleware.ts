import { Request, Response, NextFunction } from "express";
import passport from "../config/passport";

// Bảo vệ route bằng JWT và kiểm tra role nếu được cung cấp
// @param roles - Danh sách role được phép truy cập route này
export const protect = (roles?: string[]) => {
  return [
    // Xác thực JWT
    passport.authenticate("jwt", { session: false }),

    // Kiểm tra role nếu có
    (req: Request, res: Response, next: NextFunction) => {
      if (!roles || roles.length === 0) return next();

      const user = req.user as { role: string };

      if (!user || !roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient permissions" });
      }

      next();
    },
  ];
};
