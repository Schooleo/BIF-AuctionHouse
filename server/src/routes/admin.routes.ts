import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  removeProduct,
  listUsers,
  manageUserUpgradeRequests,
  approveUserUpgrade,
  getDashboardStats,
  listOrders,
  getOrderDetails,
  cancelOrder,
  deleteOrder,
  adminSendMessage,
  deleteOrderMessage,
  getSystemConfig,
  updateSystemConfig,
  updateProfile,
  changePassword,
} from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Bảo vệ tất cả các route bên dưới cho role "admin"
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

router.get("/orders", listOrders);
router.get("/orders/:id", getOrderDetails);
router.post("/orders/:id/cancel", cancelOrder);
router.delete("/orders/:id", deleteOrder);
router.post("/orders/:id/chat", adminSendMessage);
router.delete("/orders/:id/chat/:messageId", deleteOrderMessage);

// Profile
router.patch("/profile", updateProfile);
router.post("/change-password", changePassword);

// System Config Routes
router.get("/config", getSystemConfig);
router.put("/config", updateSystemConfig);

export default router;
