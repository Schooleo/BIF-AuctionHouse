import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  removeProduct,
  getUsers,
  getUserDetail,
  updateUser,
  deleteUser,
  manageUserUpgradeRequests,
  approveUserUpgrade,
  rejectUserUpgrade,
  getDashboardStats,
  listOrders,
  getOrderDetails,
  cancelOrder,
  adminSendMessage,
  deleteOrderMessage,
  getSystemConfig,
  updateSystemConfig,
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

// User Management Routes
router.get("/users", getUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/update", updateUser);
router.delete("/users/:id/delete", deleteUser);
router.get("/upgrade-requests", manageUserUpgradeRequests);
router.post("/upgrade-requests/:id/approve", approveUserUpgrade);
router.post("/upgrade-requests/:id/reject", rejectUserUpgrade);

router.get("/orders", listOrders);
router.get("/orders/:id", getOrderDetails);
router.post("/orders/:id/cancel", cancelOrder);
router.post("/orders/:id/chat", adminSendMessage);
router.delete("/orders/:id/chat/:messageId", deleteOrderMessage);

// System Config Routes
router.get("/config", getSystemConfig);
router.put("/config", updateSystemConfig);

export default router;
