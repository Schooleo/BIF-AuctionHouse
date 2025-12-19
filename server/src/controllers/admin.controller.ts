import { Request, Response } from "express";
import * as AdminService from "../services/admin.service";

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

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await AdminService.getAllUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: (search as string) || "",
      role: role as string,
      status: status as string,
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    const userDetail = await AdminService.getUserDetail(id);
    res.status(200).json(userDetail);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    const updateData = req.body;

    const updatedUser = await AdminService.updateUser(id, updateData);
    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    const { reason } = req.body;
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
