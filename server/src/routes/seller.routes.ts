import { Router } from "express";
import {
  createAuctionProduct,
  appendProductDescription,
  rejectBidder,
  answerBidderQuestion,
  viewSellerProfile,
  viewSellerProducts,
  rateWinner,
  cancelTransaction,
  transferWinner,
  viewSellerBidHistory,
  confirmWinner,
  updateSellerProfile,
  changeSellerPassword,
  completeTransaction,
} from "../controllers/seller.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import {
  createProductSchema,
  appendDescriptionSchema,
  viewSellerProductsSchema,
  rejectBidderParamsSchema,
  answerQuestionParamsSchema,
  answerQuestionBodySchema,
  productIdParamsSchema,
  sellerBidHistoryQuerySchema,
  updateSellerProfileSchema,
  changeSellerPasswordSchema,
} from "../schemas/seller.schema";

const router = Router();

// Bảo vệ tất cả các route bên dưới cho role "seller"
router.use(protect(["seller"]));

router.post(
  "/products",
  validate(createProductSchema, "body"),
  createAuctionProduct
);

router.patch(
  "/products/:id/description",
  validate(appendDescriptionSchema, "body"),
  appendProductDescription
);

router.post(
  "/products/:productId/reject-bidder/:bidderId",
  validate(rejectBidderParamsSchema, "params"),
  rejectBidder
);

router.post(
  "/products/:productId/answer-question/:questionId",
  validate(answerQuestionParamsSchema, "params"),
  validate(answerQuestionBodySchema, "body"),
  answerBidderQuestion
);

router.get(
  "/products/:productId/bid-history",
  validate(productIdParamsSchema, "params"),
  validate(sellerBidHistoryQuerySchema, "query"),
  viewSellerBidHistory
);

router.get("/profile", viewSellerProfile);

router.put(
  "/profile",
  validate(updateSellerProfileSchema, "body"),
  updateSellerProfile
);

router.patch(
  "/change-password",
  validate(changeSellerPasswordSchema, "body"),
  changeSellerPassword
);

router.get(
  "/products",
  validate(viewSellerProductsSchema, "query"),
  viewSellerProducts
);

router.post(
  "/products/:productId/confirm-winner",
  validate(productIdParamsSchema, "params"),
  confirmWinner
);

router.post("/products/:productId/rate-winner", rateWinner);
router.post("/products/:productId/cancel-transaction", cancelTransaction);
router.post("/products/:productId/transfer-winner", transferWinner);
router.post("/products/:productId/complete-transaction", completeTransaction);

export default router;
