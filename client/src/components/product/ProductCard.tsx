import React from "react";
import type { Product } from "@interfaces/product";
import ProductImage from "./ProductImage";
import { Link } from "react-router-dom";
import { maskName, formatPrice } from "@utils/product";
import { getTimeRemaining } from "@utils/time";
import { X, User, Clock, Gavel, Calendar } from "lucide-react";

interface ProductCardProps {
  product: Product;
  showRemoveButton?: boolean;
  onRemove?: (productId: string) => void;
  isRemoving?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showRemoveButton = false,
  onRemove,
  isRemoving = false,
}) => {
  const {
    _id,
    name,
    mainImage,
    currentPrice,
    buyNowPrice,
    bidders,
    bidCount,

    highestBidder,
    currentBidder,
    startTime,
    endTime,
  } = product;

  const checkRecentlyAdded = (startStr: string) => {
    const start = new Date(startStr).getTime();
    const now = Date.now();
    const diff = now - start;
    const oneDayMs = 24 * 60 * 60 * 1000;
    return diff <= oneDayMs;
  };

  const currentTopBidderName =
    currentBidder?.name ||
    highestBidder?.name ||
    (bidders && bidders.length > 0 ? bidders[bidders.length - 1].bidder.name : null);

  const totalBids = bidCount !== undefined ? bidCount : bidders?.length || 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const timeRemaining = getTimeRemaining(endTime);

  return (
    <div className="relative group h-full">
      <Link
        to={`/products/${_id}`}
        className="group flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
      >
        <ProductImage image={mainImage ?? ""} recentlyAdded={checkRecentlyAdded(startTime)} />

        <div className="p-3 sm:p-3.5 flex-1 flex flex-col gap-0.5 overflow-hidden">
          {/* Title - Fixed height for alignment (2 lines) */}
          <h3
            className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 leading-tight h-12 overflow-hidden wrap-break-words"
            title={name}
          >
            {name}
          </h3>

          {/* Price Section */}
          <div className="flex flex-col gap-1 mt-1">
            {/* Current Price */}
            <div className="flex flex-wrap items-baseline gap-1 text-primary-blue">
              <span className="text-lg sm:text-xl font-extrabold shrink-0">{formatPrice(currentPrice)}</span>
            </div>

            {/* Buy Now Price (Placeholder if missing for alignment) */}
            <div className="text-sm italic truncate">
              {buyNowPrice ? (
                <span className="text-gray-500 font-semibold truncate">
                  Buy Now: <span className="text-gray-700 font-bold truncate">{formatPrice(buyNowPrice)}</span>
                </span>
              ) : (
                <span className="text-gray-500 inline-flex items-center gap-1">
                  <X className="w-4 h-4 mr-1 mb-0 inline shrink-0" />
                  <span className="truncate">No Buy Now Price</span>
                </span>
              )}
            </div>
          </div>

          {/* Time Remaining OR Current Status */}
          <div className="text-sm sm:text-base text-red-600 font-semibold pb-1 flex items-center gap-2 truncate">
            <Clock className="w-4 h-4 mb-0.5 inline shrink-0" />
            <span className="truncate">
              {timeRemaining.text === "Ended" ? "Auction Ended !" : `${timeRemaining.text} left`}
            </span>
          </div>

          {/* Bottom Info Section */}
          <div className="space-y-1.5 text-xs sm:text-sm text-gray-600 mt-auto">
            {/* Top Bidder And Number of Bids */}
            <div className="flex items-center justify-between pr-3">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {currentTopBidderName ? (
                  <span className="font-medium truncate">{maskName(currentTopBidderName)}</span>
                ) : (
                  <span className="text-gray-500">None</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="font-medium">
                  {totalBids} {totalBids === 1 ? "bid" : "bids"}
                </span>
              </div>
            </div>

            {/* Posted Time */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Started at {formatDate(startTime)}</span>
            </div>
          </div>
        </div>
      </Link>

      {showRemoveButton && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.(product._id);
          }}
          disabled={isRemoving}
          className={`
          absolute top-2 right-2 z-10
          p-2 rounded-full 
          bg-black/60 hover:bg-red-600
          text-white
          transition-all duration-200
          opacity-0 group-hover:opacity-100
          ${isRemoving ? "cursor-not-allowed opacity-50" : "hover:scale-110"}
        `}
          title="Remove from watchlist"
        >
          {isRemoving ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};

export default ProductCard;
