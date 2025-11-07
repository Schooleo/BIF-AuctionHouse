import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import "./config/passport";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup (Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbackSecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
