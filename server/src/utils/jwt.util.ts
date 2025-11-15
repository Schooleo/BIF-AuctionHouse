import { type TokenPayload } from "../types/auth";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// Tạo JWT với payload bao gồm id, role, email
export const generateToken = (payload: TokenPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Xác thực và giải mã JWT, trả về payload nếu hợp lệ, ngược lại ném lỗi
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    throw new Error("Invalid token");
  }
};
