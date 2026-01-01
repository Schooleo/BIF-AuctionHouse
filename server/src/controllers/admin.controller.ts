import { Request, Response } from "express";
import * as AdminService from "../services/admin.service";
import { CategoryService } from "../services/category.service";

// Thêm các kiểu dữ liệu cho Request và Response nếu có sử dụng trong src/types/admin.ts
// Thêm các biến constants cho messages nếu có sử dụng trong src/constants/messages.ts

export const listCategories = async (req: Request, res: Response) => {
  try {
    const page = req.query.page
      ? parseInt(req.query.page as string)
      : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    const search = (req.query.q as string) || (req.query.search as string);

    if (page) {
      const result = await CategoryService.listCategoriesPaginated(
        page,
        limit,
        true,
        search
      );
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
      await CategoryService.updateCategory(
        category._id.toString(),
        name,
        subCategories
      );
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

    const category = await CategoryService.updateCategory(
      id,
      name,
      subCategories
    );
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

export const listUsers = async (req: Request, res: Response) => {
  // TODO: implement list users logic
  res.status(501).json({ message: "Not implemented" });
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

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      status = "active",
      categories = "",
      minPrice,
      maxPrice,
    } = req.query;

    // Parse numeric values
    const parsedMinPrice = minPrice ? Number(minPrice) : undefined;
    const parsedMaxPrice = maxPrice ? Number(maxPrice) : undefined;

    // Validate numeric values
    if (parsedMinPrice !== undefined && isNaN(parsedMinPrice)) {
      return res.status(400).json({ message: "Invalid minPrice value" });
    }
    if (parsedMaxPrice !== undefined && isNaN(parsedMaxPrice)) {
      return res.status(400).json({ message: "Invalid maxPrice value" });
    }
    if (
      parsedMinPrice !== undefined &&
      parsedMaxPrice !== undefined &&
      parsedMinPrice > parsedMaxPrice
    ) {
      return res
        .status(400)
        .json({ message: "minPrice cannot be greater than maxPrice" });
    }

    const result = await AdminService.getProducts({
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      sortBy: String(sortBy),
      sortOrder: sortOrder as "asc" | "desc",
      status: status as "active" | "ended",
      categories: String(categories),
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getSellers = async (req: Request, res: Response) => {
  try {
    const sellers = await AdminService.getSellers();
    res.status(200).json(sellers);
  } catch (error: any) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const createProductAsAdmin = async (req: Request, res: Response) => {
  try {
    const product = await AdminService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    const details = await AdminService.getProductDetails(id);
    res.status(200).json(details);
  } catch (error: any) {
    console.error("Error fetching product details:", error);
    res.status(404).json({ message: error.message || "Product not found" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    const product = await AdminService.updateProduct(id, req.body);
    res.status(200).json(product);
  } catch (error: any) {
    console.error("Error updating product:", error);
    res.status(400).json({ message: error.message || "Failed to update product" });
  }
};

export const extendProductEndTime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { endTime } = req.body;

    if (!id || !endTime) {
      res.status(400).json({ message: "Product ID and end time are required" });
      return;
    }

    const product = await AdminService.extendProductEndTime(id, endTime);
    res.status(200).json(product);
  } catch (error: any) {
    console.error("Error extending product end time:", error);
    res.status(400).json({ message: error.message || "Failed to extend end time" });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Product ID is required" });
      return;
    }

    const result = await AdminService.deleteProduct(id);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error deleting product:", error);
    res.status(400).json({ message: error.message || "Failed to delete product" });
  }
};

export const deleteProductQuestion = async (req: Request, res: Response) => {
  try {
    const { productId, questionId } = req.params;
    if (!productId || !questionId) {
      res.status(400).json({ message: "Product ID and Question ID are required" });
      return;
    }
    const result = await AdminService.deleteProductQuestion(productId, questionId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
