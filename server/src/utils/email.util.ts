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

export const sendQuestionEmail = async (
  to: string,
  sellerName: string,
  productName: string,
  productId: string,
  bidderName: string,
  question: string
) => {
  if (env.EMAIL_WEBHOOK_URL.length === 0) {
    throw new Error('Email webhook URL is not configured');
  }

  const productUrl = `${env.FRONTEND_URL}/products/${productId}`;

  const htmlBody = `
    <p>Hello ${sellerName},</p>
    <p>You have received a new question about your product <strong>${productName}</strong>.</p>

    <p><strong>Question from ${bidderName}:</strong></p>
    <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin: 10px 0;">
      ${question}
    </blockquote>

    <p>Click the link below to view the product and answer the question:</p>
    <p><a href="${productUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Product Details</a></p>

    <p>Thanks,<br/>The BIF Auction House Team</p>
  `;

  await axios.post(env.EMAIL_WEBHOOK_URL, {
    to,
    subject: `New Question About Your Product: ${productName}`,
    htmlBody,
  });
};
