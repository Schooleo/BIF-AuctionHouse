import { Router } from "express";
import {
  register,
  login,
  requestPasswordReset,
  resetPassword
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

export default router;
