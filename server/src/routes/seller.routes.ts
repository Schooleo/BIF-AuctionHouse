import { Router } from "express";
import {
  createAuctionProduct,
  appendProductDescription,
  rejectBidder,
  answerBidderQuestion,
  viewSellerProfile,
  viewSellerProducts,
  rateWinnerOrCancelTransaction,
} from "../controllers/seller.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Bảo vệ tất cả các route bên dưới cho role "seller"
router.use(protect(["seller"]));

router.post("/products", createAuctionProduct);
router.put("/products/:id/append-description", appendProductDescription);
router.post("/products/:productId/reject-bidder/:bidderId", rejectBidder);
router.post(
  "/products/:productId/answer-question/:questionId",
  answerBidderQuestion
);

router.get("/profile", viewSellerProfile);
router.get("/products", viewSellerProducts);

router.post("/rate-or-cancel/:auctionId", rateWinnerOrCancelTransaction);

export default router;
