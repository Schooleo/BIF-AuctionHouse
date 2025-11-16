import { Request, Response } from "express";
import mongoose from "mongoose";
import axios from "axios";
import { env } from "../config/env";

interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  services: {
    database: string;
    emailService?: string;
  };
}

export const getHealth = async (
  req: Request,
  res: Response<HealthResponse | { status: "error"; error: string }>
) => {
  try {
    // Kiểm tra trạng thái kết nối database
    const dbState = mongoose.connection.readyState;
    let dbStatus: string;
    switch (dbState) {
      case 0:
        dbStatus = "disconnected";
        break;
      case 1:
        dbStatus = "connected";
        break;
      case 2:
        dbStatus = "connecting";
        break;
      case 3:
        dbStatus = "disconnecting";
        break;
      default:
        dbStatus = "unknown";
    }

    // Kiểm tra trạng thái dịch vụ email (nếu có)
    let emailServiceStatus: string | undefined;
    if (env.EMAIL_WEBHOOK_URL) {
      try {
        await axios.get(env.EMAIL_WEBHOOK_URL);
        emailServiceStatus = "reachable";
      } catch {
        emailServiceStatus = "unreachable";
      }
    }

    const health: HealthResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        ...(emailServiceStatus && { emailService: emailServiceStatus }),
      },
    };

    res.json(health);
  } catch (err: unknown) {
    res.status(500).json({
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
