import { Router } from "express";
import passport from "passport";
import {
  getUser,
  requestOtp,
  register,
  login,
  requestPasswordReset,
  resetPassword,
  googleCallback,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  requestOtpSchema,
  resetPasswordSchema,
  requestPasswordResetSchema,
} from "../schemas/auth.schema";
import { protect, googleAuthMiddleware } from "../middleware/auth.middleware";

import { env } from "../config/env";

const router = Router();

router.get("/me", protect(), getUser);

// Google Auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback", googleAuthMiddleware, googleCallback);

router.post("/request-otp", validate(requestOtpSchema, "body"), requestOtp);
router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", validate(loginSchema, "body"), login);
router.post(
  "/reset-password",
  validate(requestPasswordResetSchema, "body"),
  requestPasswordReset
);
router.patch(
  "/reset-password",
  validate(resetPasswordSchema, "body"),
  resetPassword
);

export default router;
