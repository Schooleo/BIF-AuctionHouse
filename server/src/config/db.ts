import mongoose from "mongoose";
import { ENV } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the app if DB connection fails
  }
};
