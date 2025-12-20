import { Request, Response } from "express";
import * as AdminService from "../services/admin.service";
import { UserSearchParams } from "../types/admin";

// Thêm các kiểu dữ liệu cho Request và Response nếu có sử dụng trong src/types/admin.ts
// Thêm các biến constants cho messages nếu có sử dụng trong src/constants/messages.ts

export const listCategories = async (req: Request, res: Response) => {
  // TODO: implement list categories logic
  res.status(501).json({ message: "Not implemented" });
};

export const manageCategory = async (req: Request, res: Response) => {
  // TODO: implement manage category logic
  res.status(501).json({ message: "Not implemented" });
};

export const listProducts = async (req: Request, res: Response) => {
  // TODO: implement list products logic
  res.status(501).json({ message: "Not implemented" });
};

export const removeProduct = async (req: Request, res: Response) => {
  // TODO: implement remove product logic
  res.status(501).json({ message: "Not implemented" });
};

// --- User Management ---

// Get users with filtering and pagination
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, role, status, sortBy, sortOrder } = req.query;

    // Build params object
    const params: UserSearchParams = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      ...(search && { search: String(search) }),
      ...(role && { role: String(role) }),
      ...(status && { status: String(status) }),
      ...(sortBy && { sortBy: String(sortBy) }),
      ...(sortOrder && { sortOrder: String(sortOrder) as "asc" | "desc" }),
    };

    const result = await AdminService.getAllUsers(params);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const result = await AdminService.getUserDetail(id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

// Update user information
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const updatedUser = await AdminService.updateUser(id, updateData);
    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const result = await AdminService.softDeleteUser(id, reason);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const manageUserUpgradeRequests = async (
  req: Request,
  res: Response
) => {
  // TODO: implement manage user upgrade requests logic
  res.status(501).json({ message: "Not implemented" });
};

export const approveUserUpgrade = async (req: Request, res: Response) => {
  // TODO: implement approve user upgrade logic
  res.status(501).json({ message: "Not implemented" });
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const timeRange = (req.query.timeRange as string) || "24h";
    const stats = await AdminService.getDashboardStats(timeRange);
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};
