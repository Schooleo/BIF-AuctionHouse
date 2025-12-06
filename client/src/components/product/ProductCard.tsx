import React from "react";
import type { Product } from "@interfaces/product";
import ProductImage from "./ProductImage";
import { Link } from "react-router-dom";
import { maskName } from "@utils/product";
import { getTimeRemaining } from "@utils/time";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
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
  );
};

export default ProductCard;
