import { Router } from "express";
import {
  listCategories,
  manageCategory,
  listProducts,
  removeProduct,
  getUsers,
  getUserDetail,
  updateUser,
  deleteUser,
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
router.post("/categories", manageCategory);
router.get("/products", listProducts);
router.delete("/products/:id", removeProduct);

// User Management Routes
router.get("/users", getUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/update", updateUser);
router.delete("/users/:id/delete", deleteUser);
router.get("/upgrade-requests", manageUserUpgradeRequests);
router.post("/upgrade-requests/:userId/approve", approveUserUpgrade);

export default router;
