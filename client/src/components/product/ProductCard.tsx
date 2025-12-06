import React from "react";
import type { Product } from "@interfaces/product";
import ProductImage from "./ProductImage";
import { Link } from "react-router-dom";
import { maskName } from "@utils/product";
import { getTimeRemaining } from "@utils/time";
import { X } from "lucide-react";

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
    highestBidder?.name ||
    (bidders && bidders.length > 0
      ? bidders[bidders.length - 1].bidder.name
      : null);

  const totalBids = bidCount !== undefined ? bidCount : bidders?.length || 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const timeRemaining = getTimeRemaining(endTime);

  return (
    <div className="relative group">
      <Link
        to={`/product/${_id}`}
        className="group block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
      >
        <ProductImage
          image={mainImage ?? ""}
          recentlyAdded={checkRecentlyAdded(startTime)}
        />

        <div className="p-3 sm:p-4 space-y-2">
          {" "}
          <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
            {name}
          </h3>
          <p className="text-sm sm:text-base text-gray-700">
            <span className="font-semibold text-gray-800">Current Price: </span>
            <span className="text-blue-600 font-bold">
              {currentPrice.toLocaleString()}₫
            </span>
          </p>
          <p className="text-xs sm:text-sm text-gray-600">
            <span className="font-semibold">Top Bidder: </span>
            {currentTopBidderName ? (
              <span className="font-medium">
                {maskName(currentTopBidderName)}
              </span>
            ) : (
              "No bids yet"
            )}
          </p>
          {buyNowPrice && (
            <p className="text-sm sm:text-base text-orange-600 font-bold">
              Buy Now:{" "}
              <span className="text-orange-700">
                {buyNowPrice.toLocaleString()}₫
              </span>
            </p>
          )}
          <p className="text-xs sm:text-sm text-gray-500">
            <span className="font-semibold">Posted Time: </span>
            {formatDate(startTime)}
          </p>
          <p className="text-sm sm:text-base text-red-600 font-bold">
            Time Remaining:{" "}
            <span className="text-red-700">{timeRemaining.text}</span>
          </p>
          <p className="text-xs sm:text-sm text-gray-700">
            <span className="font-semibold">Number of Bids: </span>
            <span className="font-medium">{totalBids}</span>
          </p>
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
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
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
