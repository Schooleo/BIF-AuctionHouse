import React from "react";
import type { Product } from "@interfaces/product";
import { formatPrice, timeRemaining } from "@utils/product";
import { formatBidTime, formatDateTime } from "@utils/time";
import {
  CalendarDays,
  Crown,
  Gavel,
  Loader2,
  ShieldX,
  Users,
} from "lucide-react";

interface SellerProductSummaryProps {
  product: Product;
  isEnded: boolean;
  onOpenBidHistory: () => void;
  onConfirmWinner: () => void;
  confirmDisabled: boolean;
  confirmLoading: boolean;
  winnerConfirmed: boolean;
  categoryName?: string;
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
}) => {
  const displayCategory =
    categoryName ??
    (typeof product.category === "string"
      ? product.category
      : product.category?.name ?? "Unknown Category");

  const highestBidderName = product.highestBidder?.name ?? "No active bids";
  const highestBidderRating = product.highestBidder?.rating;

  const statusLabel = isEnded ? "Ended" : "Ongoing";
  const statusStyles = isEnded
    ? "bg-red-100 text-red-700"
    : "bg-green-100 text-green-700";

  //const rejectedCount = product.rejectedBidders?.length ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {product.name}
          </h1>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Category:</span>{" "}
            {displayCategory}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyles}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Current Price
          </p>
          <p className="text-2xl font-bold text-primary-blue mt-1">
            {formatPrice(product.currentPrice ?? product.startingPrice)}
          </p>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Gavel className="w-4 h-4 text-gray-400" />
            Step price: {formatPrice(product.stepPrice ?? 0)}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Auction Timing
          </p>
          <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            Starts: {formatBidTime(product.startTime)}
          </p>
          <p className="text-sm text-gray-700 flex items-center gap-2 mt-1">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            Ends: {formatDateTime(product.endTime)}
          </p>
          {!isEnded && (
            <p className="text-xs text-gray-500 mt-2">
              Time remaining: {timeRemaining(product.endTime)}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Highest Bidder
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <span className="flex items-center gap-2 text-gray-800 font-semibold">
            <Users className="w-4 h-4 text-gray-400" />
            {highestBidderName}
          </span>
          {highestBidderRating !== undefined && (
            <span className="text-xs text-yellow-600 font-medium">
              {highestBidderRating.toFixed(2)} ★ rating
            </span>
          )}
          {/* <span className="text-xs text-gray-500">
            Total bids: {product.bidCount}
          </span>
            <span className="text-xs flex items-center gap-1 text-gray-500">
              <ShieldX className="w-3 h-3 text-gray-400" />
              Rejected bidders: {rejectedCount}
            </span> */}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onOpenBidHistory}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-blue bg-primary-blue/10 hover:bg-primary-blue/20 rounded-lg transition"
        >
          <Gavel className="w-4 h-4" />
          View Bid History
        </button>

        {isEnded && (
          <button
            type="button"
            onClick={onConfirmWinner}
            disabled={confirmDisabled || confirmLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700"
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
    </div>
  );
};

export default SellerProductSummary;