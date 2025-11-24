import { Router } from "express";
import {
  addToWatchlist,
  getSuggestedPrice,
  placeBid,
  viewBidHistory,
  askSellerQuestion,
  viewProfile,
  editProfile,
  viewFavorites,
  viewParticipatingAuctions,
  viewWonAuctions,
  rateSeller,
  requestSellerUpgrade,
} from "../controllers/bidder.controller";
import { protect } from "../middleware/auth.middleware";
import { validate, validateQuery } from "../middleware/validate";
import { placeBidSchema, bidHistoryQuerySchema } from "../schemas/bidder.schema";

const router = Router();

// Bảo vệ tất cả các route bên dưới cho role "bidder"
router.use(protect(["bidder"]));

router.post("/watchlist", addToWatchlist);
router.get("/bid/suggest/:productId", getSuggestedPrice);
router.post("/bid", validate(placeBidSchema), placeBid);
router.get("/bid-history/:productId", validateQuery(bidHistoryQuerySchema), viewBidHistory);
router.post("/ask-seller/:productId", askSellerQuestion);

router.get("/profile", viewProfile);
router.put("/profile", editProfile);

router.get("/favorites", viewFavorites);
router.get("/participating-auctions", viewParticipatingAuctions);
router.get("/won-auctions", viewWonAuctions);

router.post("/rate-seller/:sellerId", rateSeller);
router.post("/request-seller-upgrade", requestSellerUpgrade);

export default router;
