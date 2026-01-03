import { Router } from "express";
import {
  createProductSchema,
  updateProductSchema,
  extendEndTimeSchema,
} from "../schemas/admin.schema";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  removeProduct,
  getUsers,
  getUserDetail,
  createUser,
  updateUser,
  blockUser,
  unblockUser,
  deleteUser,
  forceDeleteUser,
  manageUserUpgradeRequests,
  approveUserUpgrade,
  rejectUserUpgrade,
  getDashboardStats,
  listOrders,
  getOrderDetails,
  cancelOrder,
  deleteOrder,
  adminSendMessage,
  deleteOrderMessage,
  getSystemConfig,
  updateSystemConfig,
  getProducts,
  getSellers,
  createProductAsAdmin,
  getProductDetails,
  updateProduct,
  extendProductEndTime,
  deleteProduct,
  deleteProductQuestion,
  // Extended user management
  getLinkedAccountProfile,
  getUserProducts,
  getUserOrdersSummary,
  updateReview,
  deleteReview,
  // Banned users management
  getBannedUsers,
  getUnbanRequest,
  approveUnbanRequest,
  denyUnbanRequest,
  updateProfile,
  changePassword,
  resetUserPassword,
} from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { createProductSchema } from "../schemas/admin.schema";

const router = Router();

// Bảo vệ tất cả các route bên dưới cho role "admin"
router.use(protect(["admin"]));

router.get("/dashboard-stats", getDashboardStats);

router.get("/products", getProducts);
router.get("/sellers", getSellers);
router.post("/products", validate(createProductSchema, "body"), createProductAsAdmin);
router.get("/products/:id", getProductDetails);
router.patch("/products/:id", validate(updateProductSchema, "body"), updateProduct);
router.post("/products/:id/extend", validate(extendEndTimeSchema, "body"), extendProductEndTime);
router.delete("/products/:id", deleteProduct);
router.delete("/products/:productId/questions/:questionId", deleteProductQuestion); 

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// User Management Routes
router.get("/users", getUsers);
router.post("/users", createUser);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/update", updateUser);
router.post("/users/:id/block", blockUser);
router.post("/users/:id/unblock", unblockUser);
router.delete("/users/:id/delete", deleteUser);
router.delete("/users/:id/force-delete", forceDeleteUser);

// NEW: Extended user routes
router.get("/users/:id/linked-profile", getLinkedAccountProfile);
router.get("/users/:id/products", getUserProducts);
router.get("/users/:id/orders-summary", getUserOrdersSummary);

// Upgrade Request Routes
router.get("/upgrade-requests", manageUserUpgradeRequests);
router.post("/upgrade-requests/:id/approve", approveUserUpgrade);
router.post("/upgrade-requests/:id/reject", rejectUserUpgrade);

// Order Routes
router.get("/orders", listOrders);
router.get("/orders/:id", getOrderDetails);
router.post("/orders/:id/cancel", cancelOrder);
router.delete("/orders/:id", deleteOrder);
router.post("/orders/:id/chat", adminSendMessage);
router.delete("/orders/:id/chat/:messageId", deleteOrderMessage);

// NEW: Review Management Routes
router.patch("/reviews/:id", updateReview);
router.delete("/reviews/:id", deleteReview);

// Profile
router.patch("/profile", updateProfile);
router.post("/change-password", changePassword);

// System Config Routes
router.get("/config", getSystemConfig);
router.put("/config", updateSystemConfig);

// Banned Users & Unban Request Routes
router.get("/banned-users", getBannedUsers);
router.get("/banned-users/:userId/unban-request", getUnbanRequest);
router.post("/unban-requests/:id/approve", approveUnbanRequest);
router.post("/unban-requests/:id/deny", denyUnbanRequest);

// Reset user password
router.post("/users/:id/reset-password", resetUserPassword);

export default router;
