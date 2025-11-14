import { Request, Response } from "express";
import crypto from "crypto"; 
import { User } from "../models/user.model";
import { generateToken } from "../utils/jwt.util"; 
import { sendResetEmail } from "../utils/email.util"; 
import { env } from "../config/env";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, address } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email is already registered" });

    const user = await User.create({
      name,
      email,
      password, // Gửi mật khẩu gốc (Hash ở user.model)
      address, 
    });

    // Tạo token JWT để đăng nhập
    const token = generateToken(user.id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(404).json({ message: "User Not Found" });

    // Method comparePassword ở user.model
    const valid = await user.comparePassword(password);

    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user.id);

    // Tạo phản hồi an toàn
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User Not Found" });

    // Dùng method ở user để tạo token và hashed token (trả về token gốc)
    const resetToken = user.generatePasswordResetToken();

    // Lưu các thay đổi (token đã băm và thời gian hết hạn) vào DB
    await user.save({ validateBeforeSave: false }); // Bỏ qua xác thực vì chúng ta chỉ lưu token

    // 4. Gửi token gốc qua email
    const resetURL = `${env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendResetEmail(user.email, resetURL);

    res.json({ message: "Password reset confirmation email sent" });
  } catch (error) {
    console.error("Password reset error:", error);
    // Xóa token nếu có lỗi xảy ra để ngăn trạng thái không nhất quán
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        //user.resetPasswordToken = null;
        //user.resetPasswordExpires = null;
        await user.save({ validateBeforeSave: false });
      }
    }
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Reset Token Not Found" });
  }

  try {
    // 1. Hash token gốc nhận được từ URL
    const hashedToken = crypto
     .createHash("sha256")
     .update(token)
     .digest("hex");

    // 2. Tìm người dùng bằng token sau khi hash và kiểm tra thời gian hết hạn
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // 3. Đặt mật khẩu mới
    user.password = password; // 'pre-save hook' bên user.model sẽ tự động hash lại

    // 4. Xóa các trường token sau khi sử dụng
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    // 5. Đăng nhập người dùng bằng cách cấp token JWT mới
    const jwtToken = generateToken(user.id);

    res.json({ message: "Password reset successful", token: jwtToken });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};