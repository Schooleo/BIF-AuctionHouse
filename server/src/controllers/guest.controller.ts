import { Request, Response } from "express";
import { ZodError } from "zod";
import { ProductService } from "../services/product.service";

import { searchProductsQuerySchema } from "../schemas/guest/searchProduct.schema";
import { viewByCategoryQuerySchema } from "../schemas/guest/viewByCategory.schema";
import {
  viewProductDetailParamsSchema,
  viewProductDetailQuerySchema,
} from "../schemas/guest/viewProductDetail.schema";

// Centralized error handler
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
    // TODO: Implement fetching categories from DB or service
    return res.status(501).json({ message: "List categories not implemented" });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /home
export const viewHome = async (req: Request, res: Response) => {
  try {
    const homeData = await ProductService.listHomeData();
    return res.status(200).json(homeData);
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /products (by category)
export const viewProductsByCategory = async (req: Request, res: Response) => {
  try {
    const query = viewByCategoryQuerySchema.parse(req.query);

    const results = await ProductService.searchProducts({
      category: query.category,
      page: query.page,
      limit: query.limit,
      sort: "createdDesc",
      q: "",
    });

    return res.status(200).json(results);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: err.format(),
      });
    }
    return handleError(res, err);
  }
};

// GET /products/search
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const query = searchProductsQuerySchema.parse(req.query);

    const results = await ProductService.searchProducts({
      ...query,
      q: query.q ?? "",
    });

    return res.status(200).json(results);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: err.format(),
      });
    }
    return handleError(res, err);
  }
};

// GET /products/:id
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
        errors: err.format(),
      });
    }
    return handleError(res, err);
  }
};
