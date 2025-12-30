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

// Kept for compatibility if used elsewhere or remove if not needed.
// 'manageCategory' was the old placeholder name, we can alias it or just remove it if we update routes.
export const manageCategory = createCategory;

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
