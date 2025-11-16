import { Router } from "express";
import {
  listCategories,
  viewHome,
  viewProductsByCategory,
  searchProducts,
  viewProductDetail,
} from "../controllers/guest.controller";
import { getHealth } from "../controllers/health.controller";

const router = Router();

// Public routes (nên không cần bảo vệ)
router.get("/categories", listCategories);
router.get("/home", viewHome);
router.get("/products", viewProductsByCategory);
router.get("/products/search", searchProducts);
router.get("/products/:id", viewProductDetail);

// Route kiểm tra trạng thái hệ thống
router.get("/health", getHealth);

export default router;
