import { Router } from "express";
import {
  addToWatchlist,
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
} from '../controllers/bidder.controller';
import { protect } from "../middleware/auth.middleware";
import { validate, validateQuery } from "../middleware/validate";
import { placeBidSchema, bidHistoryQuerySchema } from "../schemas/bidder.schema";
import {
  updateProfileSchema,
  changePasswordSchema,
  rateSellerSchema,
  updateSellerRatingSchema,
} from '../schemas/bidder.schema';

const router = Router();

// Bảo vệ tất cả các route bên dưới cho role "bidder"
router.use(protect(["bidder"]));

router.post("/watchlist", addToWatchlist);
router.get("/bid/suggest/:productId", getSuggestedPrice);
router.post("/bid", validate(placeBidSchema), placeBid);
router.get("/bid-history/:productId", validateQuery(bidHistoryQuerySchema), viewBidHistory);
router.post("/ask-seller/:productId", askSellerQuestion);

router.get("/profile", viewProfile);
router.put('/profile', validate(updateProfileSchema), editProfile);
router.put('/profile/password', validate(changePasswordSchema), changePassword);
router.get('/profile/ratings', viewReceivedRatings);

router.get('/watchlist', viewWatchlist);
router.get("/participating-auctions", viewParticipatingAuctions);
router.get("/won-auctions", viewWonAuctions);

router.post('/rate-seller/:sellerId', validate(rateSellerSchema), rateSeller);
router.put('/rate-seller/:sellerId', validate(updateSellerRatingSchema), updateRating);
router.delete('/rate-seller/:sellerId', deleteRating);

router.post('/request-seller-upgrade', requestSellerUpgrade);
router.get('/upgrade-request-status', getUpgradeRequestStatus);

export default router;
