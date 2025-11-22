import { IUser } from "../models/user.model";

// Khai báo mở rộng cho Express Request để bao gồm thông tin user
declare global {
  namespace Express {
    interface User extends IUser {}
    interface Request {
      user?: User;
    }
  }
}
