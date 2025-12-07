import type { BidItem } from "../../interfaces/bidder";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { maskName } from "@utils/product";
import { getTimeRemaining } from "@utils/time";

interface BiddingProductCardProps {
  bid: BidItem;
}

const BiddingProductCard: React.FC<BiddingProductCardProps> = ({ bid }) => {
  const {
    _id,
    name,
    mainImage,
    currentPrice,
    buyNowPrice,
    bidCount,
    seller,
    endTime,
    isWinning,
    awaitingConfirmation,
    currentBidder,
    bidStatus,
    inProcessing,
  } = bid;

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return {
          text: "Active Bidding",
          bgColor: "bg-blue-100",
          textColor: "text-blue-700",
        };
      case "awaiting":
        return {
          text: "Awaiting Confirmation",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-700",
        };
      case "processing":
        return {
          text: "Payment & Delivery",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
        };
      default:
        return {
          text: "Unknown",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
        };
    }
  };

  const badgeInfo = getBidStatusBadge(bidStatus);

  const timeRemaining = getTimeRemaining(endTime);

  const getTimeColor = () => {
    if (timeRemaining.isEnded) return "text-gray-500";
    if (timeRemaining.isUrgent) return "text-red-600 font-bold";
    return "text-gray-800";
  };

  const timeColor = getTimeColor();

  return (
    <div className="group bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* ========== LEFT: IMAGE WITH BADGE ========== */}
        <div className="relative flex-shrink-0 w-full sm:w-48 h-48 sm:h-36">
          <Link to={`/product/${_id}`}>
            <img
              src={mainImage || "/placeholder.jpg"}
              alt={name}
              className="w-full h-full object-cover rounded-md group-hover:opacity-90 transition"
            />
          </Link>

          {/* Badge - góc trên trái ảnh */}
          <div
            className={`absolute top-2 left-2 ${badgeInfo.bgColor} ${badgeInfo.textColor} px-3 py-1 rounded-full text-xs font-semibold shadow-lg`}
          >
            {badgeInfo.text}
          </div>
        </div>

        {/* ========== CENTER: PRODUCT INFO ========== */}
        <div className="flex-1 min-w-0">
          <Link to={`/product/${_id}`}>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 hover:text-blue-600 line-clamp-2 mb-2">
              {name}
            </h3>
          </Link>

          <div className="space-y-1.5 text-sm">
            {/* Current Price - LUÔN HIỂN THỊ */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Current:</span>
              <span className="text-blue-600 font-bold text-base">
                {currentPrice.toLocaleString()}₫
              </span>
            </div>

            {/* Buy Now Price - NẾU CÓ */}
            {buyNowPrice && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Buy Now:</span>
                <span className="text-orange-600 font-bold">
                  {buyNowPrice.toLocaleString()}₫
                </span>
              </div>
            )}

            {/* Top Bidder - CHỈ HIỆN KHI BỊ OUTBID */}
            {!isWinning && !awaitingConfirmation && currentBidder?.name && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Top Bidder:</span>
                <span className="text-red-600 font-semibold">
                  {maskName(currentBidder.name)}
                </span>
              </div>
            )}

            {/* Seller - CHỈ HIỆN KHI AWAITING CONFIRMATION */}
            {(awaitingConfirmation || inProcessing) && seller?.name && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">Seller:</span>
                <span className="text-gray-800 font-semibold">
                  {seller.name}
                </span>
              </div>
            )}

            {/* Bid Count - LUÔN HIỂN THỊ */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Total Bids:</span>
              <span className="text-gray-800 font-semibold">{bidCount}</span>
            </div>
          </div>
        </div>

        {/* ========== RIGHT: TIME & ACTIONS ========== */}
        <div className="flex-shrink-0 flex flex-col justify-between items-end sm:w-40 gap-3">
          {/* Time Remaining */}
          <div className={`text-right ${timeColor}`}>
            <div className="text-xs text-gray-500 mb-1">Time Left</div>
            <div
              className={`text-lg font-bold ${timeRemaining.isUrgent ? "animate-pulse" : ""}`}
            >
              {timeRemaining.text}
            </div>
          </div>

          {/* View Details Button */}
          <Link
            to={`/product/${_id}`}
            className="w-full px-4 py-2 bg-primary-blue text-white rounded-md hover:bg-primary-blue-dark transition text-center text-sm font-medium"
          >
            View Details <ArrowRight className="inline-block w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ========== BOTTOM: AWAITING MESSAGE ========== */}
      {awaitingConfirmation && !inProcessing && (
        <div className="border-t border-gray-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800 text-center">
            The auction has ended. Waiting for{" "}
            <span className="font-semibold">
              {seller?.name ? seller.name : "seller"}
            </span>{" "}
            to confirm the winner.
          </p>
        </div>
      )}

      {/* ========== BOTTOM: PROCESSING MESSAGE ========== */}
      {inProcessing && (
        <div className="border-t border-gray-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-800 text-center">
            Congratulations! You won this auction.{" "}
            <span className="font-semibold">
              Payment and delivery in progress.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default BiddingProductCard;
