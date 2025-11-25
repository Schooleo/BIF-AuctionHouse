import { Router } from "express";
import {
  getUser,
  requestOtp,
  register,
  login,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  requestOtpSchema,
  resetPasswordSchema,
  requestPasswordResetSchema,
} from "../schemas/auth.schema";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", protect(), getUser);

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
