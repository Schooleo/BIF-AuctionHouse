import { Router } from "express";
import {
  addToWatchlist,
  removeFromWatchlist,
  checkInWatchlist,
  getSuggestedPrice,
  placeBid,
  viewBidHistory,
  askSellerQuestion,
  viewProfile,
  editProfile,
  viewWatchlist,
  viewParticipatingAuctions,
  viewWonAuctions,
  rateSeller,
  requestSellerUpgrade,
  getUpgradeRequestStatus,
  changePassword,
  viewReceivedRatings,
  updateRating,
  deleteRating,
  viewMyBids,
  acknowledgeAutoBid,
  submitUnbanRequest,
  getUnbanRequestStatus as getBidderUnbanRequestStatus,
} from "../controllers/bidder.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { placeBidSchema } from "../schemas/bidder.schema";
import { createUnbanRequestSchema } from "../schemas/unban.schema";
import {
  updateProfileSchema,
  changePasswordSchema,
  rateSellerSchema,
  updateSellerRatingSchema,
  upgradeRequestSchema,
} from "../schemas/bidder.schema";

const router = Router();

// Bảo vệ tất cả các route bên dưới cho role "bidder"
router.use(protect(["bidder"]));

router.post("/watchlist", addToWatchlist);
router.delete("/watchlist/:productId", removeFromWatchlist);
router.get("/watchlist/check/:productId", checkInWatchlist);
router.get("/bid/suggest/:productId", getSuggestedPrice);
router.post("/bid", validate(placeBidSchema, "body"), placeBid);
router.post("/bid/acknowledge-auto-bid", acknowledgeAutoBid);
// router.get("/bid-history/:productId", validate(bidHistoryQuerySchema, "query"), viewBidHistory); // Moved to guest/public routes
router.post("/ask-seller/:productId", askSellerQuestion);
router.get("/my-bids", viewMyBids);
router.get("/profile", viewProfile);
router.put("/profile", validate(updateProfileSchema, "body"), editProfile);
router.put(
  "/profile/password",
  validate(changePasswordSchema, "body"),
  changePassword
);
router.get("/profile/ratings", viewReceivedRatings);

router.get("/watchlist", viewWatchlist);
router.get("/participating-auctions", viewParticipatingAuctions);
router.get("/won-auctions", viewWonAuctions);

router.post(
  "/rate-seller/:sellerId",
  validate(rateSellerSchema, "body"),
  rateSeller
);
router.put(
  "/rate-seller/:sellerId",
  validate(updateSellerRatingSchema, "body"),
  updateRating
);
router.delete("/rate-seller/:sellerId", deleteRating);

router.post(
  "/request-seller-upgrade",
  validate(upgradeRequestSchema, "body"),
  requestSellerUpgrade
);
router.get("/upgrade-request-status", getUpgradeRequestStatus);

// Unban request routes
router.post(
  "/unban-request",
  validate(createUnbanRequestSchema, "body"),
  submitUnbanRequest
);
router.get("/unban-request/status", getBidderUnbanRequestStatus);

export default router;
