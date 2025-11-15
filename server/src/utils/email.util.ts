import nodemailer from "nodemailer";
import { env } from "../config/env";

export const sendResetEmail = async (toEmail: string, token: string) => {
  try {
    // Tạo transporter sử dụng cấu hình SMTP
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: false, // true cho port 465, false cho các port khác
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    // Tạo URL reset password
    const resetURL = `${env.FRONTEND_URL}/reset-password/${token}`;

    // Cấu hình email
    const mailOptions = {
      from: `"BIF Auction House" <no-reply@bifauction.com>`, // Sender name and email
      to: toEmail, // Recipient email
      subject: "Password Reset Request", // Email subject
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your password for your BIF Auction House account.</p>
        <p>Click the link below to reset your password. This link will expire in 10 minutes.</p>
        <p><a href="${resetURL}">Reset Password</a></p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Thanks,<br/>The BIF Auction House Team</p>
      `, // Email body in HTML
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log("Reset email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw new Error("Could not send reset email");
  }
};
