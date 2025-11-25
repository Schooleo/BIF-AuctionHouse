import { Router } from "express";
import {
  listCategories,
  viewHome,
  viewProducts,
  viewProductDetail,
} from "../controllers/guest.controller";
import { getHealth } from "../controllers/health.controller";
import { validate } from "../middleware/validate";

// Import Zod schemas
import {
  viewProductsSchema,
  viewProductDetailParamsSchema,
} from "../schemas/guest/index.schema";

const router = Router();

// Public routes
router.get("/categories", listCategories);

router.get("/home", viewHome);

router.get("/products", validate(viewProductsSchema, "query"), viewProducts);

router.get(
  "/product/:id",
  validate(viewProductDetailParamsSchema, "params"),
  viewProductDetail
);

// Health check
router.get("/health", getHealth);

export default router;
