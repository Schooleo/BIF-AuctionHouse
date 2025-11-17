import axios from "axios";
import { env } from "../config/env";

export const sendOTPEmail = async (to: string, otp: string) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error("Email webhook URL is not configured");
  }

  const htmlBody = `
    <p>Hello,</p>
    <p>Your One-Time Password (OTP) for BIF Auction House is:</p>

    <h2>${otp}</h2>

    <p>This OTP is valid for the next 5 minutes. Please do not share it with anyone.</p>
    <p>If you did not request this OTP, plsease ignore this email.</p>
    <p>Thanks,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: "Your OTP for BIF Auction House",
    htmlBody,
  });
};

export const sendPasswordResetOTPEmail = async (to: string, otp: string) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error("Email webhook URL is not configured");
  }

  const htmlBody = `
    <p>Hello,</p>
    <p>We received a request to reset your password. Use the One-Time Password (OTP) below to proceed:</p>

    <h2>${otp}</h2>

    <p>This OTP is valid for the next 5 minutes. Please do not share it with anyone.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thanks,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: "Your Password Reset OTP for BIF Auction House",
    htmlBody,
  });
};
