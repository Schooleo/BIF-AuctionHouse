export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string | undefined;
  status?: string | undefined;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}
