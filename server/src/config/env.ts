import dotenv from "dotenv";

dotenv.config(); // Loads .env file into process.env

// Validate required environment variables
const requiredEnv = ["MONGODB_URI", "PORT", "JWT_SECRET", "SESSION_SECRET"];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Export variables for safe access
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT ? Number(process.env.PORT) : 3001,
  MONGODB_URI: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  SESSION_SECRET: process.env.SESSION_SECRET as string,
};
