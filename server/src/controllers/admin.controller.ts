import { Request, Response } from "express";
import * as AdminService from "../services/admin.service";
import { UserSearchParams, AuthRequest } from "../types/admin";
import { CategoryService } from "../services/category.service";

// Thêm các kiểu dữ liệu cho Request và Response nếu có sử dụng trong src/types/admin.ts
// Thêm các biến constants cho messages nếu có sử dụng trong src/constants/messages.ts

export const listCategories = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    const search = (req.query.q as string) || (req.query.search as string);

    if (page) {
      const result = await CategoryService.listCategoriesPaginated(page, limit, true, search);
      res.status(200).json(result);
    } else {
      const categories = await CategoryService.listCategories(true); // includeStats = true
      res.status(200).json(categories);
    }
  } catch (error) {
    res.status(500).json({ message: "Error listing categories" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parentId, subCategories } = req.body;
    // Cast to any to safely access _id (Mongoose document)
    const category: any = await CategoryService.createCategory(name, parentId);

    if (subCategories && Array.isArray(subCategories)) {
      // If creating a main category with initial sub-categories
      await CategoryService.updateCategory(category._id.toString(), name, subCategories);
    }

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error creating category" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subCategories } = req.body;

    if (!id) {
      res.status(400).json({ message: "ID is required" });
      return;
    }

    const category = await CategoryService.updateCategory(id, name, subCategories);
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error updating category" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "ID is required" });
      return;
    }

    await CategoryService.deleteCategory(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
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
    const { page, limit, search, role, status, sortBy, sortOrder, viewTrash } =
      req.query;

    // Build params object
    const params: UserSearchParams = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      ...(search && { search: String(search) }),
      ...(role && { role: String(role) }),
      ...(status && { status: String(status) }),
      ...(sortBy && { sortBy: String(sortBy) }),
      ...(sortOrder && { sortOrder: String(sortOrder) as "asc" | "desc" }),
      viewTrash: viewTrash === "true",
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

// Create new user (admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !address) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Validate role
    if (role && !["bidder", "seller"].includes(role)) {
      res.status(400).json({ message: "Role must be 'bidder' or 'seller'" });
      return;
    }

    const user = await AdminService.createUser({
      name,
      email,
      password,
      address,
      role: role || "bidder",
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (error: any) {
    if (
      error.message.includes("duplicate key") ||
      error.message.includes("already exists")
    ) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }
    res.status(500).json({ message: error.message || "Failed to create user" });
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

// Block user
export const blockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: "Block reason is required" });
      return;
    }

    const result = await AdminService.blockUser(id, reason);
    res.status(200).json(result);
  } catch (error: any) {
    const knownErrors = [
      "User not found",
      "Cannot block admin accounts",
      "User is already blocked",
    ];

    if (knownErrors.includes(error.message)) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// Unblock user
export const unblockUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const result = await AdminService.unblockUser(id);
    res.status(200).json(result);
  } catch (error: any) {
    const knownErrors = ["User not found", "User is already active"];

    if (knownErrors.includes(error.message)) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user?._id?.toString();

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const result = await AdminService.deleteUser(id, adminId);
    res.status(200).json(result);
  } catch (error: any) {
    // Handle specific errors with appropriate status codes
    const knownErrors = [
      "User not found",
      "Cannot delete your own account",
      "Cannot delete admin accounts",
      "Cannot delete user with active orders",
      "Cannot delete seller with active auctions",
      "Cannot delete seller with pending auction results. Please ensure all ended auctions have been processed.",
    ];

    if (knownErrors.includes(error.message)) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const manageUserUpgradeRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const { page, limit, status, search, sortBy } = req.query;

    const params = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      ...(status && {
        status: String(status) as "pending" | "approved" | "rejected",
      }),
      ...(search && { search: String(search) }),
      ...(sortBy && { sortBy: String(sortBy) as "newest" | "oldest" }),
    };

    const result = await AdminService.getAllUpgradeRequests(params);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveUserUpgrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Request ID
    const adminId = (req as any).user._id;

    if (!id) {
      res.status(400).json({ message: "Request ID is required" });
      return;
    }

    const result = await AdminService.approveUpgradeRequest(id, adminId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectUserUpgrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Request ID
    const { reason } = req.body;
    const adminId = (req as any).user._id;

    if (!id) {
      res.status(400).json({ message: "Request ID is required" });
      return;
    }

    if (!reason) {
      res.status(400).json({ message: "Rejection reason is required" });
      return;
    }

    const result = await AdminService.rejectUpgradeRequest(id, adminId, reason);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
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

export const listOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const filter = (req.query.filter as string) || "all";
    const sort = (req.query.sort as string) || "newest";
    const search = (req.query.q as string) || (req.query.search as string);

    const result = await AdminService.listOrdersPaginated(
      page,
      limit,
      filter,
      sort,
      search
    );
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error listing orders" });
  }
};

export const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "ID is required" });
      return;
    }
    const order = await AdminService.getOrderDetails(id);
    res.status(200).json(order);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "ID is required" });
      return;
    }
    const order = await AdminService.cancelOrder(id);
    res.status(200).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const adminSendMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Order ID
    const { content } = req.body;
    const adminId = (req as any).user._id;

    if (!id || !content) {
      res.status(400).json({ message: "ID and content are required" });
      return;
    }

    const chat = await AdminService.adminSendMessage(id, content, adminId);
    res.status(200).json(chat);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteOrderMessage = async (req: Request, res: Response) => {
  try {
    const { id, messageId } = req.params; // Order ID, Message ID
    if (!id || !messageId) {
      res.status(400).json({ message: "ID and message ID are required" });
      return;
    }
    await AdminService.deleteChatMessage(id, messageId);
    res.status(200).json({ message: "Message deleted" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    const config = await AdminService.getSystemConfig();
    res.status(200).json(config);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching system config" });
  }
};

export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const data = req.body; // should validate fields here or in service
    const config = await AdminService.updateSystemConfig(data);
    res.status(200).json(config);
  } catch (error: any) {
    res.status(400).json({ message: "Error updating system config" });
  }
};

// ==========================================
// NEW: Linked Account & Extended User Stats
// ==========================================

// Get linked account profile for upgraded accounts
export const getLinkedAccountProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const result = await AdminService.getLinkedAccountProfile(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get user products (seller: their products, bidder: participated auctions)
export const getUserProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, page, limit } = req.query;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    if (!role || !["seller", "bidder"].includes(role as string)) {
      res.status(400).json({ message: "Role must be 'seller' or 'bidder'" });
      return;
    }

    const result = await AdminService.getUserProducts(
      id,
      role as "seller" | "bidder",
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get user's orders summary by status
export const getUserOrdersSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const result = await AdminService.getUserOrdersSummary(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Update review comment
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!id) {
      res.status(400).json({ message: "Review ID is required" });
      return;
    }

    if (!comment || typeof comment !== "string") {
      res.status(400).json({ message: "Comment is required" });
      return;
    }

    const result = await AdminService.updateReview(id, comment);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Review ID is required" });
      return;
    }

    const result = await AdminService.deleteReview(id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// BANNED USERS & UNBAN REQUEST MANAGEMENT
// ==========================================

// Get all banned users
export const getBannedUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await AdminService.getBannedUsers({
      page,
      limit,
      ...(search && { search }),
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get unban request for a user
export const getUnbanRequest = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const result = await AdminService.getUnbanRequestByUser(userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Approve unban request
export const approveUnbanRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as unknown as AuthRequest).user?.userId;

    if (!id) {
      res.status(400).json({ message: "Request ID is required" });
      return;
    }
    if (!adminId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await AdminService.approveUnbanRequest(id, adminId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Deny unban request
export const denyUnbanRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as unknown as AuthRequest).user?.userId;
    const { adminNote } = req.body;

    if (!id) {
      res.status(400).json({ message: "Request ID is required" });
      return;
    }
    if (!adminId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await AdminService.denyUnbanRequest(id, adminId, adminNote);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
