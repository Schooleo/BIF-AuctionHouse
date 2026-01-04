import React, { useState } from "react";
import type { Product } from "@interfaces/product";
import { formatPrice, timeRemaining, maskName } from "@utils/product";
import { formatDateTime } from "@utils/time";
import UserRatingDetailsModal from "@components/user/UserRatingDetailsModal";
import { CalendarDays, Crown, History, Loader2, User, Star, Box, Flame, Gavel } from "lucide-react";

interface SellerProductSummaryProps {
  product: Product;
  isEnded: boolean;
  onOpenBidHistory: () => void;
  onConfirmWinner: () => void;
  confirmDisabled: boolean;
  confirmLoading: boolean;
  winnerConfirmed: boolean;
  categoryName?: string;
  onManageTransaction?: () => void;
  showFire?: boolean;
}

const SellerProductSummary: React.FC<SellerProductSummaryProps> = ({
  product,
  isEnded,
  onOpenBidHistory,
  onConfirmWinner,
  confirmDisabled,
  confirmLoading,
  winnerConfirmed,
  categoryName,
  onManageTransaction,
  showFire,
}) => {
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [selectedBidderName, setSelectedBidderName] = useState<string | null>(null);

  const displayCategory =
    categoryName ??
    (typeof product.category === "string" ? product.category : (product.category?.name ?? "Unknown Category"));

  const bidderLabel = winnerConfirmed ? "Winner" : "Highest Bidder";

  // Use currentBidder as the primary source, fallback to highestBidder
  const effectiveBidder = product.currentBidder || product.highestBidder;

  const highestBidderDisplay = effectiveBidder?.name ? effectiveBidder.name : "No active bids";

  const highestBidderRating = effectiveBidder?.rating;

  const statusLabel = isEnded ? "Ended" : "Ongoing";
  const statusStyles = isEnded ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700";

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Category:</span> {displayCategory}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-m font-semibold ${statusStyles}`}>
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 relative overflow-hidden">
          {showFire && (
            <div className="absolute top-2 right-2 animate-bounce">
              <Flame className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
          )}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Price</p>
          <p
            className={`text-2xl font-bold mt-1 ${showFire ? "text-red-600 transition-colors duration-300" : "text-primary-blue"}`}
          >
            {formatPrice(product.currentPrice ?? product.startingPrice)}
          </p>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Gavel className="w-4 h-4 text-gray-400" />
            Step price: {formatPrice(product.stepPrice ?? 0)}
          </p>
        </div>
        <div className="flex flex-col items-start justify-around p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Auction Timeline</p>
          <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            Starts: {formatDateTime(product.startTime)}
          </p>
          <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            Ends: {formatDateTime(product.endTime)}
          </p>
          {!isEnded && <p className="text-xs text-gray-500 mt-2">Time remaining: {timeRemaining(product.endTime)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
          <div>
            <p
              className={
                winnerConfirmed
                  ? "text-base font-bold text-emerald-600 uppercase tracking-wide"
                  : "text-sm font-bold text-indigo-600 uppercase tracking-wide"
              }
            >
              {bidderLabel}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              {effectiveBidder?._id ? (
                <button
                  onClick={() => {
                    setSelectedBidderId(effectiveBidder._id);
                    setSelectedBidderName(effectiveBidder.name || null);
                    setIsRatingModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-gray-800 font-semibold hover:text-primary-blue hover:underline transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  {highestBidderDisplay}
                </button>
              ) : (
                <span className="flex items-center gap-2 text-gray-800 font-semibold">
                  <User className="w-4 h-4 text-gray-400" />
                  {highestBidderDisplay}
                </span>
              )}
              {highestBidderRating !== undefined && (
                <span className="flex items-center gap-2 text-s text-yellow-600 font-medium">
                  <Star className="w-4 h-4 text-yellow-600" />
                  {highestBidderRating.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenBidHistory}
          className="flex items-center justify-start gap-4 px-6 py-4 w-full h-full text-left text-sm font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition"
        >
          <History className="w-7 h-7 text-gray-500 shrink-0" />
          <div className="flex flex-col gap-2">
            <span className="text-primary-blue">View Bid History</span>
            <span className="text-md tracking-wide font-medium text-gray-600">Total bids: {product.bidCount}</span>
          </div>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {isEnded && (
          <button
            type="button"
            onClick={onConfirmWinner}
            disabled={confirmDisabled || confirmLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 p-4 text-lg font-semibold text-white rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700"
          >
            {confirmLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming...
              </>
            ) : winnerConfirmed ? (
              <>
                <Crown className="w-4 h-4" />
                Winner Confirmed
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Confirm Winner
              </>
            )}
          </button>
        )}
      </div>

      {isEnded && winnerConfirmed && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onManageTransaction}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition bg-indigo-600 hover:bg-indigo-700"
          >
            <Box className="w-4 h-4" />
            Go to Order
          </button>
        </div>
      )}

      {selectedBidderId && (
        <UserRatingDetailsModal
          isOpen={isRatingModalOpen}
          onClose={() => {
            setIsRatingModalOpen(false);
            setSelectedBidderId(null);
            setSelectedBidderName(null);
          }}
          userId={selectedBidderId}
          userName={selectedBidderName || undefined}
        />
      )}
    </div>
  );
};

export default SellerProductSummary;
