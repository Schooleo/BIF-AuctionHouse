import Router from "express";
import { OrderController } from "../controllers/order.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect()); // All order routes require auth

router.post("/", OrderController.createOrder); // Create via productId
router.get("/:id", OrderController.getOrder);

router.put("/:id/step1", OrderController.updateStep1);
router.put("/:id/step2", OrderController.updateStep2);
router.put("/:id/step3", OrderController.updateStep3);
router.post("/:id/rating", OrderController.submitRating);

// Chat embedded in Order routes for simplicity
router.get("/:id/chat", OrderController.getChat);
router.post("/:id/chat", OrderController.sendMessage);

export default router;
