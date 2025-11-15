import { Router } from "express";
import {
  listCategories,
  viewHome,
  viewProductsByCategory,
  searchProducts,
  viewProductDetail,
} from "../controllers/guest.controller";

const router = Router();

// Public routes (nên không cần bảo vệ)
router.get("/categories", listCategories);
router.get("/home", viewHome);
router.get("/products", viewProductsByCategory);
router.get("/products/search", searchProducts);
router.get("/products/:id", viewProductDetail);

export default router;
