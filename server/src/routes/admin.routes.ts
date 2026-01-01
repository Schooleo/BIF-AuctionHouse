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
  listUsers,
  manageUserUpgradeRequests,
  approveUserUpgrade,
  getDashboardStats,
  listOrders,
  getOrderDetails,
  cancelOrder,
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
  deleteProductQuestion, // Add this
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
router.delete("/products/:productId/questions/:questionId", deleteProductQuestion); // Add this

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

router.get("/users", listUsers);
router.get("/upgrade-requests", manageUserUpgradeRequests);
router.post("/upgrade-requests/:userId/approve", approveUserUpgrade);

router.get("/orders", listOrders);
router.get("/orders/:id", getOrderDetails);
router.post("/orders/:id/cancel", cancelOrder);
router.post("/orders/:id/chat", adminSendMessage);
router.delete("/orders/:id/chat/:messageId", deleteOrderMessage);

// System Config Routes
router.get("/config", getSystemConfig);
router.put("/config", updateSystemConfig);

export default router;
