import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models/user.model";
import { OtpModel } from "../models/otp.model";
import { generateToken } from "../utils/jwt.util";
import { verifyRecaptcha } from "../utils/recaptcha.util";
import { sendOTPEmail, sendResetEmail } from "../utils/email.util";
import {
  RequestOtpBody,
  RegisterBody,
  LoginBody,
  RequestPasswordResetBody,
  ResetPasswordBody,
  ResetPasswordParams,
} from "../types/auth";
import { AuthMessages } from "../constants/messages";

// Kiểm tra định dạng email cơ bản
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const requestOtp = async (
  req: Request<{}, {}, RequestOtpBody>,
  res: Response
) => {
  const { email } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: AuthMessages.EMAIL_INVALID });
  }

  // Kiểm tra email đã được đăng ký
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: AuthMessages.EMAIL_REGISTERED });
  }

  // Tạo OTP 6 chữ số ngẫu nhiên
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Xóa OTP cũ nếu tồn tại
  await OtpModel.findOneAndDelete({ email });

  // Tạo OTP mới
  await OtpModel.create({
    email,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  // Gửi OTP bằng Apps Script
  await sendOTPEmail(email, otp);

  return res.json({ message: AuthMessages.OTP_SENT });
};

export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response
) => {
  const { name, email, password, address, otp, recaptchaToken } = req.body;

  // Kiểm tra input
  if (!name || !email || !password || !otp || !recaptchaToken) {
    return res.status(400).json({ message: AuthMessages.MISSING_FIELDS });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: AuthMessages.EMAIL_INVALID });
  }

  // Kiểm tra reCAPTCHA
  try {
    const valid = await verifyRecaptcha(recaptchaToken);
    if (!valid) {
      return res.status(400).json({ message: AuthMessages.RECAPTCHA_FAILED });
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return res.status(500).json({ message: "Server Error" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: AuthMessages.PASSWORD_TOO_SHORT });
  }

  try {
    // Kiểm tra OTP
    const otpRecord = await OtpModel.findOne({ email });
    if (
      !otpRecord ||
      otpRecord.otp !== otp ||
      otpRecord.expiresAt < new Date()
    ) {
      return res.status(400).json({ message: AuthMessages.OTP_INVALID });
    }

    // Xóa OTP sau khi sử dụng
    await OtpModel.findOneAndDelete({ email });

    const user = await User.create({
      name,
      email,
      password, // Gửi mật khẩu gốc (Hash ở user.model)
      address,
    });

    // Tạo token JWT để đăng nhập
    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

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

export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
  const { email, password } = req.body;

  // Kiểm tra input
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: AuthMessages.MISSING_EMAIL_OR_PASSWORD });
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ message: AuthMessages.INVALID_CREDENTIALS });
    }

    // Method comparePassword ở user.model
    const valid = await user.comparePassword(password);

    if (!valid) {
      return res
        .status(401)
        .json({ message: AuthMessages.INVALID_CREDENTIALS });
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

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

export const requestPasswordReset = async (
  req: Request<{}, {}, RequestPasswordResetBody>,
  res: Response
) => {
  const { email } = req.body;

  // Kiểm tra email hợp lệ
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: AuthMessages.EMAIL_INVALID });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: AuthMessages.PASSWORD_RESET_EMAIL_SENT }); // Không tiết lộ email không tồn tại
    }

    // Dùng method ở user để tạo token và hashed token (trả về token gốc)
    const resetToken = user.generatePasswordResetToken();

    // Lưu các thay đổi (token đã băm và thời gian hết hạn) vào DB
    await user.save({ validateBeforeSave: false }); // Bỏ qua xác thực vì chúng ta chỉ lưu token

    // Gửi email với token gốc được tạo trong hàm util
    await sendResetEmail(user.email, resetToken);

    res.json({ message: AuthMessages.PASSWORD_RESET_EMAIL_SENT });
  } catch (error) {
    console.error("Password reset error:", error);

    // Xóa token nếu có lỗi xảy ra để ngăn trạng thái không nhất quán
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save({ validateBeforeSave: false });
      }
    }
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPassword = async (
  req: Request<ResetPasswordParams, {}, ResetPasswordBody>,
  res: Response
) => {
  const { token } = req.params;
  const { password } = req.body;

  // Kiểm tra token và mật khẩu mới
  if (!token) {
    return res
      .status(400)
      .json({ message: AuthMessages.RESET_TOKEN_NOT_FOUND });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: AuthMessages.PASSWORD_TOO_SHORT });
  }

  try {
    // 1. Hash token gốc nhận được từ URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Tìm người dùng bằng token sau khi hash và kiểm tra thời gian hết hạn
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: AuthMessages.RESET_TOKEN_INVALID });
    }

    // 3. Đặt mật khẩu mới
    user.password = password; // 'pre-save hook' bên user.model sẽ tự động hash lại

    // 4. Xóa các trường token sau khi sử dụng
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    // 5. Đăng nhập người dùng bằng cách cấp token JWT mới
    const jwtToken = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    res.json({ message: AuthMessages.PASSWORD_RESET_SUCCESS, token: jwtToken });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
