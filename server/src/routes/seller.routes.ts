import { Router } from "express";
import {
  createAuctionProduct,
  appendProductDescription,
  rejectBidder,
  answerBidderQuestion,
  viewSellerProfile,
  viewSellerProducts,
  rateWinnerOrCancelTransaction,
  updateSellerProfile,
  changeSellerPassword,
} from "../controllers/seller.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import {
  createProductSchema,
  appendDescriptionSchema,
  viewSellerProductsSchema,
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
router.post("/products/:productId/reject-bidder/:bidderId", rejectBidder);
router.post(
  "/products/:productId/answer-question/:questionId",
  answerBidderQuestion
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

router.post("/rate-or-cancel/:auctionId", rateWinnerOrCancelTransaction);

export default router;
