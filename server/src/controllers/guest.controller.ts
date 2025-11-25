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
    const homeData = await ProductService.listHomeData();
    return res.status(200).json(homeData);
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /products
export const viewProducts = async (req: Request, res: Response) => {
  try {
    const query = viewProductsSchema.parse(req.query);

    const results = await ProductService.searchProducts({
      q: query.q ?? "",
      category: query.category,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });

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
