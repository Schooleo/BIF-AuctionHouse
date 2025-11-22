import { User } from "../models/user.model";
import { OtpModel } from "../models/otp.model";
import { generateToken } from "../utils/jwt.util";
import { sendOTPEmail, sendPasswordResetOTPEmail } from "../utils/email.util";
import { verifyRecaptcha } from "../utils/recaptcha.util";
import { AuthMessages } from "../constants/messages";

export const authService = {
  async getUser(id: string) {
    const user = await User.findById(id);
    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      positiveRatings: user.positiveRatings,
      negativeRatings: user.negativeRatings,
      reputationScore: user.reputationScore,
    };
  },

  async requestOtp(email: string, from: "register" | "reset-password") {
    const existing = await User.findOne({ email });

    if (from === "register" && existing) {
      throw new Error(AuthMessages.EMAIL_REGISTERED);
    }

    if (from === "reset-password" && !existing) {
      throw new Error(AuthMessages.EMAIL_INVALID);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OtpModel.findOneAndDelete({ email });

    await OtpModel.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOTPEmail(email, otp);
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    address: string;
    otp: string;
    recaptchaToken: string;
  }) {
    const { email, otp, recaptchaToken } = data;

    const recaptchaOK = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaOK) throw new Error(AuthMessages.RECAPTCHA_FAILED);

    const otpRecord = await OtpModel.findOne({ email });
    if (
      !otpRecord ||
      otpRecord.otp !== otp ||
      otpRecord.expiresAt < new Date()
    ) {
      throw new Error(AuthMessages.OTP_INVALID);
    }

    await OtpModel.findOneAndDelete({ email });

    const user = await User.create(data);

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return { user, token };
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error(AuthMessages.INVALID_CREDENTIALS);

    const valid = await user.comparePassword(password);
    if (!valid) throw new Error(AuthMessages.INVALID_CREDENTIALS);

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return { user, token };
  },

  async requestPasswordReset(email: string) {
    const user = await User.findOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OtpModel.findOneAndDelete({ email });

    await OtpModel.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 1000 * 60),
    });

    if (user) {
      await sendPasswordResetOTPEmail(email, otp);
    }
  },

  async resetPassword(email: string, otp: string, password: string) {
    const otpRecord = await OtpModel.findOne({ email });
    if (!otpRecord || otpRecord.otp !== otp) {
      throw new Error(AuthMessages.OTP_INVALID);
    }

    const user = await User.findOne({ email });
    if (!user) throw new Error(AuthMessages.OTP_INVALID);

    await OtpModel.findOneAndDelete({ email });

    user.password = password;
    await user.save();

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return { user, token };
  },
};
