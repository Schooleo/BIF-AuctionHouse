import { Request, Response } from "express";
import { User } from "../models/user.model";
import { OtpModel } from "../models/otp.model";
import { generateToken } from "../utils/jwt.util";
import { sendOTPEmail, sendPasswordResetOTPEmail } from "../utils/email.util";
import { verifyRecaptcha } from "../utils/recaptcha.util";
import {
  RequestOtpBody,
  RegisterBody,
  LoginBody,
  RequestPasswordResetBody,
  ResetPasswordBody,
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

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: AuthMessages.EMAIL_INVALID });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: AuthMessages.PASSWORD_RESET_EMAIL_SENT });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any old OTP for this email to prevent conflicts
    await OtpModel.findOneAndDelete({ email });

    // Create a new OTP record, valid for 5 minutes
    await OtpModel.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5-minute expiry
    });

    // Send the password reset OTP email
    await sendPasswordResetOTPEmail(email, otp);

    return res.json({ message: AuthMessages.PASSWORD_RESET_EMAIL_SENT });
  } catch (error) {
    console.error("Request Password Reset error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordBody>,
  res: Response
) => {
  const { email, otp, password } = req.body;

  // Validate inputs
  if (!email || !otp || !password) {
    return res.status(400).json({ message: AuthMessages.MISSING_FIELDS });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: AuthMessages.PASSWORD_TOO_SHORT });
  }

  try {
    // Find and validate the OTP
    const otpRecord = await OtpModel.findOne({ email });
    if (
      !otpRecord ||
      otpRecord.otp !== otp ||
      otpRecord.expiresAt < new Date()
    ) {
      return res.status(400).json({ message: AuthMessages.OTP_INVALID });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: AuthMessages.OTP_INVALID });
    }

    // Delete the OTP
    await OtpModel.findOneAndDelete({ email });

    // Update the password
    user.password = password;
    await user.save();

    // Log the user in by issuing a new JWT
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

    res.json({
      message: AuthMessages.PASSWORD_RESET_SUCCESS,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
