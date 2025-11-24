import React from "react";
import type { Product } from "@interfaces/product";
import {
  formatPostedTime,
  timeRemaining,
  formatPrice,
  maskName,
} from "@utils/product";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

interface ProductInfoCardProps {
  product: Product;
  isGuest: boolean;
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  product,
  isGuest,
}) => {
  const highestBidder = product.bidders[product.bidders.length - 1];

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <h1 className="text-3xl font-bold">{product.name}</h1>

      <p className="text-gray-500">
        Posted Time: {formatPostedTime(product.startTime)}
      </p>

      <p className="text-red-600 font-semibold">
        Time Remaining: {timeRemaining(product.endTime)}
      </p>

      <p className="text-xl font-semibold">
        Current Price: {formatPrice(product.currentPrice)}
      </p>
      {product.buyNowPrice && (
        <p className="text-lg text-green-600">
          Buy Now Price: {formatPrice(product.buyNowPrice)}
        </p>
      )}

      <p className="text-gray-700">
        Seller - {product.seller.name} •{" "}
        <span className="text-yellow-500">
          {`★`.repeat(Math.round(product.seller.rating))}{" "}
          {product.seller.rating.toFixed(1)}
        </span>
      </p>

      {highestBidder && (
        <p className="text-gray-700">
          Current Highest Bidder - {maskName(highestBidder.bidder.name)} •{" "}
          <span className="text-yellow-500">
            {`★`.repeat(Math.round(highestBidder.bidder.rating))}{" "}
            {highestBidder.bidder.rating.toFixed(1)}
          </span>
        </p>
      )}

      {/* Button Area */}
      <div className="flex flex-col gap-4 mt-6 max-w-sm">
        {/* Bid History & Watchlist (Logged in) */}
        {!isGuest && (
          <div className="flex justify-center items-center gap-4 text-white mb-2">
            {/* Bid History Link */}
            <Link
              to={`/product/${product._id}/bids`}
              className="bg-primary-blue rounded-2xl hover:scale-105 transition-transform duration-150 px-4 py-2"
            >
              View Bid History
            </Link>

            {/* Gạch giữa */}
            <span className="h-4 w-px bg-gray-300"></span>

            {/* Add to Watchlist Link (Xử lý API) */}
            <Link
              to={`/user/watchlist`}
              className="bg-red-500 rounded-2xl hover:scale-105 transition-transform duration-150 px-4 py-2"
            >
              <Heart className="inline-block mr-2" size={16} />
              Add to Watchlist
            </Link>
          </div>
        )}

        {/* Place a Bid / Sign in Button (Primary) */}
        {isGuest ? (
          <Link
            to="/auth/login"
            className={`text-xl font-semibold w-full px-6 py-4 rounded-2xl shadow-md bg-primary-blue text-white hover:scale-105 transition-transform duration-200 text-center block`}
          >
            Sign In to Start Bidding
          </Link>
        ) : (
          <button
            className={`text-xl font-semibold w-full px-6 py-3 rounded-2xl shadow-md bg-primary-blue text-white hover:scale-105 transition-transform duration-200`}
          >
            Place a bid
          </button>
        )}
      </div>

      {/* Product Description - Move down to appear after all primary info/actions */}
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-2">Description</h2>
        <p>{product.description}</p>
      </div>
    </div>
  );
};

export default ProductInfoCard;
