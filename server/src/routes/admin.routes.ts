import { Router } from "express";
import {
  listCategories,
  manageCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  removeProduct,
  listUsers,
  manageUserUpgradeRequests,
  approveUserUpgrade,
  getDashboardStats,
} from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Bao vệ tất cả các route bên dưới cho role "admin"
router.use(protect(["admin"]));

router.get("/dashboard-stats", getDashboardStats);
router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.get("/products", listProducts);
router.delete("/products/:id", removeProduct);

router.get("/users", listUsers);
router.get("/upgrade-requests", manageUserUpgradeRequests);
router.post("/upgrade-requests/:userId/approve", approveUserUpgrade);

export default router;
