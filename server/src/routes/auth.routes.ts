import { Router } from "express";
import {
  register,
  login,
  requestPasswordReset,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", requestPasswordReset);

export default router;
