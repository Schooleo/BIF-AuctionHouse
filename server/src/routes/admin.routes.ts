import { Router } from "express";
import {
  listCategories,
  manageCategory,
  listProducts,
  removeProduct,
  listUsers,
  manageUserUpgradeRequests,
  approveUserUpgrade,
} from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Bao vệ tất cả các route bên dưới cho role "admin"
router.use(protect(["admin"]));

router.get("/categories", listCategories);
router.post("/categories", manageCategory);
router.get("/products", listProducts);
router.delete("/products/:id", removeProduct);

router.get("/users", listUsers);
router.get("/upgrade-requests", manageUserUpgradeRequests);
router.post("/upgrade-requests/:userId/approve", approveUserUpgrade);

export default router;
