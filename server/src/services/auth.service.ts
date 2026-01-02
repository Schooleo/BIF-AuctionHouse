import { User } from "../models/user.model";
import { OtpModel } from "../models/otp.model";
import { BlacklistedEmail } from "../models/blacklistedEmail.model";
import { generateToken } from "../utils/jwt.util";
import { sendOTPEmail, sendPasswordResetOTPEmail } from "../utils/email.util";
import { verifyRecaptcha } from "../utils/recaptcha.util";
import { AuthMessages } from "../constants/messages";
import * as crypto from "crypto";

export const authService = {
  async getUser(id: string) {
    const user = await User.findById(id);
    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      contactEmail: user.contactEmail,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      positiveRatings: user.positiveRatings,
      negativeRatings: user.negativeRatings,
      reputationScore: user.reputationScore,
      googleId: user.googleId,
      isUpgradedAccount: user.isUpgradedAccount,
      linkedAccountId: user.linkedAccountId,
      blockReason: user.blockReason,
      blockedAt: user.blockedAt,
    };
  },

  async requestOtp(email: string, from: "register" | "reset-password") {
    const existing = await User.findOne({ email });

    if (from === "register" && existing) {
      throw new Error(AuthMessages.EMAIL_REGISTERED);
    }

    // Check if email is blacklisted (for registration)
    if (from === "register") {
      const blacklisted = await BlacklistedEmail.findOne({
        email: email.toLowerCase(),
      });
      if (blacklisted) {
        throw new Error(
          "This email has been permanently deleted from our system."
        );
      }
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

  async handleGoogleAuth(profile: any) {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new Error("No email found from Google profile");
    }

    // Check if email or googleId is blacklisted
    const blacklisted = await BlacklistedEmail.findOne({
      $or: [{ email: email.toLowerCase() }, { googleId: profile.id }],
    });
    if (blacklisted) {
      throw new Error("This account has been permanently deleted.");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.googleId) {
        throw new Error(
          "This email is already registered with password. Please login using your email and password."
        );
      }
      return existingUser;
    }

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    let baseName = profile.displayName.replace(/[^a-zA-Z0-9]/g, "");
    if (baseName.length > 10) baseName = baseName.substring(0, 10);
    const username = `${baseName}${randomDigits}`;

    const randomPassword = crypto.randomBytes(16).toString("hex");

    const newUser = await User.create({
      name: username,
      email: email,
      password: randomPassword,
      googleId: profile.id,
      role: "bidder",
      address: "",
    });

    return newUser;
  },

  generateAuthToken(user: any) {
    return generateToken({
      id: user._id || user.id,
      role: user.role,
      email: user.email,
    });
  },

  /**
   * Switch between linked accounts (bidder <-> seller)
   */
  async switchAccount(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isUpgradedAccount || !user.linkedAccountId) {
      throw new Error("This account is not linked to another account");
    }

    const linkedAccount = await User.findById(user.linkedAccountId);
    if (!linkedAccount) {
      throw new Error("Linked account not found");
    }

    // Generate new token for linked account
    const token = generateToken({
      id: (linkedAccount as any)._id.toString(),
      role: linkedAccount.role,
      email: linkedAccount.email,
    });

    return {
      user: {
        id: linkedAccount._id,
        name: linkedAccount.name,
        email: linkedAccount.email,
        role: linkedAccount.role,
        positiveRatings: linkedAccount.positiveRatings,
        negativeRatings: linkedAccount.negativeRatings,
        reputationScore: linkedAccount.reputationScore,
        googleId: linkedAccount.googleId,
        isUpgradedAccount: linkedAccount.isUpgradedAccount,
        linkedAccountId: linkedAccount.linkedAccountId,
      },
      token,
    };
  },
};
