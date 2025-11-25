import { Router } from "express";
import {
  listCategories,
  viewHome,
  viewProductsByCategory,
  searchProducts,
  viewProductDetail,
} from "../controllers/guest.controller";
import { getHealth } from "../controllers/health.controller";
import { validate } from "../middleware/validate";

// Import your Zod schemas
import {
  viewByCategoryQuerySchema,
  searchProductsQuerySchema,
  viewProductDetailParamsSchema,
} from "../schemas/guest/index.schema";

const router = Router();

// Public routes
router.get("/categories", listCategories);

router.get("/home", viewHome);

// Get products by category
router.get(
  "/products",
  viewProductsByCategory
);

// Search products (query validation)
router.get(
  "/products/search",
  /*validate(searchProductsQuerySchema, "query"),*/
  searchProducts
);

// View product detail (params + query validation)
router.get(
  "/products/:id",
  /*validate(viewProductDetailParamsSchema, "params"),*/
  viewProductDetail
);

// Health check
router.get("/health", getHealth);

export default router;
