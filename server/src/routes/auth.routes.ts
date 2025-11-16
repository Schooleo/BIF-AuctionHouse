import { Router } from "express";
import {
  requestOtp,
  register,
  login,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", requestPasswordReset);
router.patch("/reset-password/:token", resetPassword);

export default router;
