import { Router } from "express";
import guestRoutes from "./guest.routes";
import bidderRoutes from "./bidder.routes";
import sellerRoutes from "./seller.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// Guest / public routes
router.use("/guest", guestRoutes);

// Bidder routes (đã bảo vệ trong file bidder.routes.ts)
router.use("/bidder", bidderRoutes);

// Seller routes (đã bảo vệ trong file seller.routes.ts)
router.use("/seller", sellerRoutes);

// Admin routes (đã bảo vệ trong file admin.routes.ts)
router.use("/admin", adminRoutes);

export default router;
