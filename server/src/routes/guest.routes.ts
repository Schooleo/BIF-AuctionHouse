import { Router } from "express";
import {
  listCategories,
  viewHome,
  viewProducts,
  viewProductDetail,
  getUserRatings,
} from "../controllers/guest.controller";
import { viewBidHistory } from "../controllers/bidder.controller";
import { getHealth } from "../controllers/health.controller";
import { validate } from "../middleware/validate";
import { optionalProtect } from "../middleware/auth.middleware";
import { bidHistoryQuerySchema } from "../schemas/bidder.schema";

// Import Zod schemas
import {
  viewProductsSchema,
  viewProductDetailParamsSchema,
} from "../schemas/guest/index.schema";

const router = Router();

// Public routes
router.get("/categories", listCategories);

router.get("/home", optionalProtect, viewHome);

router.get(
  "/products",
  optionalProtect,
  validate(viewProductsSchema, "query"),
  viewProducts
);

router.get(
  "/product/:id",
  validate(viewProductDetailParamsSchema, "params"),
  viewProductDetail
);

// Get user ratings (available to authenticated users)
router.get("/users/:userId/ratings", getUserRatings);

// Health check
router.get("/health", getHealth);

// Bid History (Public query, optional auth for unmasking)
router.get(
  "/bid-history/:productId",
  optionalProtect,
  validate(bidHistoryQuerySchema, "query"),
  viewBidHistory
);

export default router;
