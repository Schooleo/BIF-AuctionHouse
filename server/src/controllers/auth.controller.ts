import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AuthMessages } from "../constants/messages";
import { User } from "../models/user.model";
import { generateToken } from "../utils/jwt.util";
import { env } from "../config/env";

export const getUser = async (req: Request, res: Response) => {
  if (!req.user) return res.status(200).json({ user: null });

  try {
    const userData = await authService.getUser(req.user.id);
    if (!userData) return res.status(404).json({ user: null });

    res.json({ user: userData });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  const { email, from } = req.body;

  try {
    await authService.requestOtp(email, from);
    res.json({ message: AuthMessages.OTP_SENT });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ user, token });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { user, token } = await authService.login(
      req.body.email,
      req.body.password
    );
    res.json({ user, token });
  } catch (e: any) {
    res.status(401).json({ message: e.message });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.json({ message: AuthMessages.PASSWORD_RESET_EMAIL_SENT });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { user, token } = await authService.resetPassword(
      req.body.email,
      req.body.otp,
      req.body.password
    );

    res.json({
      message: AuthMessages.PASSWORD_RESET_SUCCESS,
      token,
      user,
    });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    res.redirect(`${env.FRONTEND_URL}?token=${token}`);
  } catch (e: any) {
    res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(e.message)}`);
  }
};
