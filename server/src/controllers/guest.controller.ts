import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ProductService } from "../services/product.service";
import { CategoryService } from "../services/category.service";
import { viewProductsSchema } from "../schemas/guest/viewProducts.schema";

import {
  viewProductDetailParamsSchema,
  viewProductDetailQuerySchema,
} from "../schemas/guest/viewProductDetail.schema";

const handleError = (res: Response, error: any, status = 500) => {
  console.error(error);
  return res
    .status(status)
    .json({ message: error?.message || "Internal server error" });
};

// ------------------ Controllers ------------------

// GET /categories
export const listCategories = async (req: Request, res: Response) => {
  try {
    const categories = await CategoryService.listCategories();
    return res.status(200).json(categories);
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /home
export const viewHome = async (req: Request, res: Response) => {
  try {
    const isAuthenticated = !!(req as any).user;
    const homeData = await ProductService.listHomeData(isAuthenticated);
    return res.status(200).json(homeData);
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /products
export const viewProducts = async (req: Request, res: Response) => {
  try {
    const query = viewProductsSchema.parse(req.query);

    const isAuthenticated = !!(req as any).user;

    const results = await ProductService.searchProducts(
      {
        q: query.q ?? "",
        category: query.category,
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        min_price: query.min_price,
        max_price: query.max_price,
      },
      isAuthenticated
    );

    return res.status(200).json(results);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: z.treeifyError(err),
      });
    }
    return handleError(res, err);
  }
};

// GET /product/:id
export const viewProductDetail = async (req: Request, res: Response) => {
  try {
    const params = viewProductDetailParamsSchema.parse(req.params);
    const query = viewProductDetailQuerySchema.parse(req.query);

    const productDetail = await ProductService.getProductDetail(params.id, {
      bidHistoryPage: query.page,
      bidHistoryLimit: query.limit,
    });

    if (!productDetail) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(productDetail);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid request parameters",
        errors: z.treeifyError(err),
      });
    }
    return handleError(res, err);
  }
};

// GET /users/:userId/ratings
export const getUserRatings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const score = parseInt(req.query.score as string); // 1 or -1 or undefined

    // Import models
    const { User } = await import("../models/user.model");
    const { Rating } = await import("../models/rating.model");

    // Check if user exists
    const user = await User.findById(userId).select(
      "name positiveRatings negativeRatings reputationScore"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build rating query
    const skip = (page - 1) * limit;
    const query: any = { ratee: userId };
    if (!isNaN(score) && (score === 1 || score === -1)) {
      query.score = score;
    }

    // Fetch ratings and total count
    const [ratings, total] = await Promise.all([
      Rating.find(query)
        .populate("rater", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Rating.countDocuments(query),
    ]);

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        positiveRatings: user.positiveRatings,
        negativeRatings: user.negativeRatings,
        reputationScore: user.reputationScore,
      },
      ratings: ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return handleError(res, err);
  }
};
