import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || "3001",
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "changeme",
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY || "",
  EMAIL_WEBHOOK_URL: process.env.EMAIL_WEBHOOK_URL || "lnnt190805@gmail.com",
};
