import { Router } from "express";
import authRoutes from "./auth.routes";
import guestRoutes from "./guest.routes";
import bidderRoutes from "./bidder.routes";
import sellerRoutes from "./seller.routes";
import adminRoutes from "./admin.routes";
import orderRoutes from "./order.routes";

const router = Router();

// Guest routes (public)
router.use("/guest", guestRoutes);

// Authentication routes (public)
router.use("/auth", authRoutes);

// Bidder routes (đã bảo vệ trong file bidder.routes.ts)
router.use("/bidder", bidderRoutes);

// Seller routes (đã bảo vệ trong file seller.routes.ts)
router.use("/seller", sellerRoutes);

// Admin routes (đã bảo vệ trong file admin.routes.ts)
router.use("/admin", adminRoutes);

router.use("/orders", orderRoutes);

export default router;
