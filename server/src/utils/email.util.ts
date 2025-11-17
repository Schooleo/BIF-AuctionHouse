import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (email: string, token: string) => {
  const resetLink = `${env.FRONTEND_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: `"AuctionHouse" <${env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
    `,
  });
};
