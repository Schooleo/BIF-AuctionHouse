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

router.post("/request-otp", validate(requestOtpSchema), requestOtp);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post(
  "/reset-password",
  validate(requestPasswordResetSchema),
  requestPasswordReset
);
router.patch("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
