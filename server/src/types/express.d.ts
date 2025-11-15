import { IUser } from "../models/user.model";

// Khai báo mở rộng cho Express Request để bao gồm thông tin user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "bidder" | "seller" | "admin";
        email?: string;
      };
    }
  }
}
