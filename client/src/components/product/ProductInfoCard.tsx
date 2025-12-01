import React, { useState } from "react";
import type { Product } from "@interfaces/product";
import {
  formatPostedTime,
  timeRemaining,
  formatPrice,
  maskName,
} from "@utils/product";
import { Link } from "react-router-dom";
import { Heart, CheckIcon } from "lucide-react";
import Spinner from "@components/ui/Spinner";
import BidModal from "./BidModal";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import BidHistoryModal from "./BidHistoryModal";
import { useAlertStore } from "@stores/useAlertStore";

interface ProductInfoCardProps {
  product: Product;
  isGuest: boolean;
  onUpdateProduct?: (updatedProduct: Product) => void;
}

const ExpandableText = ({
  text,
  limit = 300,
}: {
  text: string;
  limit?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= limit) return <>{text}</>;

  return (
    <>
      {isExpanded ? text : `${text.slice(0, limit)}...`}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-primary-blue hover:underline ml-2 font-medium"
      >
        {isExpanded ? "See less" : "See more"}
      </button>
    </>
  );
};

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  product,
  isGuest,
  onUpdateProduct,
}) => {
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false);
  const addAlert = useAlertStore((state) => state.addAlert);

  const handleAddToWatchlist = async () => {
    setIsAddingToWatchlist(true);
    try {
      await bidderApi.addToWatchlist(
        product._id,
        useAuthStore.getState().token || ""
      );
      setIsInWatchlist(true);
      addAlert("success", "Added to watchlist successfully!");
    } catch (error: any) {
      const message = error.message || "";

      if (message.includes("already") || message.includes("exists")) {
        addAlert("warning", "Product is already in your watchlist.");
        setIsInWatchlist(true);
      } else {
        addAlert("error", message || "Failed to add to watchlist.");
      }
    } finally {
      setIsAddingToWatchlist(false);
    }
  };
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
        Seller - {product.seller?.name || "Seller"} •{" "}
        <span className="text-yellow-500">
          {`★`.repeat(Math.round(product.seller?.rating || 0))}{" "}
          {product.seller?.rating?.toFixed(1) || "N/A"}
        </span>
      </p>
      <p className="text-gray-700">
        Current Highest Bidder -{" "}
        {product.bidCount > 0 ? (
          <>
            {maskName(product.highestBidder.name || "Anonymous")} •{" "}
            <span className="text-yellow-500">
              {`★`.repeat(Math.round(product.highestBidder.rating))}{" "}
              {product.highestBidder.rating.toFixed(1)}
            </span>
          </>
        ) : (
          <span className="text-gray-500 italic">No bids yet</span>
        )}
      </p>
      {/* Button Area */}
      <div className="flex flex-col gap-4 mt-6 max-w-sm">
        {/* Bid History & Watchlist (Logged in) */}
        {!isGuest && (
          <div className="flex justify-center items-center gap-4 text-white mb-2">
            {/* Bid History Link */}
            <button
              type="button"
              onClick={() => setIsBidHistoryOpen(true)}
              className="bg-primary-blue rounded-2xl hover:scale-105 transition-transform duration-150 px-4 py-2 hover:cursor-pointer"
            >
              View Bid History
            </button>

            {/* Gạch giữa */}
            <span className="h-4 w-px bg-gray-300"></span>

            {/* Add to Watchlist Link (Xử lý API) */}
            <button
              type="button"
              onClick={handleAddToWatchlist}
              disabled={isInWatchlist || isAddingToWatchlist}
              className={`${isInWatchlist ? "bg-gray-400 cursor-not-allowed" : "bg-red-500"} rounded-2xl hover:scale-105 transition-transform duration-150 px-4 py-3 flex items-center gap-2 hover:cursor-pointer`}
            >
              {isAddingToWatchlist ? (
                <>
                  <Spinner />
                  <span>Adding...</span>
                </>
              ) : isInWatchlist ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Place a Bid / Sign in Button (Primary) */}
        {isGuest ? (
          <Link
            to="/auth/login"
            className={`text-xl font-semibold w-full px-6 py-4 rounded-2xl shadow-md bg-primary-blue text-white hover:scale-105 transition-transform duration-200 text-center block cursor-pointer`}
          >
            Sign In to Start Bidding
          </Link>
        ) : (
          <button
            onClick={() => setIsBidModalOpen(true)}
            className={`text-xl font-semibold w-full px-6 py-3 rounded-2xl shadow-md bg-primary-blue text-white hover:scale-105 transition-transform duration-200 cursor-pointer`}
          >
            Place a bid
          </button>
        )}
      </div>

      <BidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        productId={product._id}
        productName={product.name}
        onUpdateProduct={onUpdateProduct}
      />

      <BidHistoryModal
        isOpen={isBidHistoryOpen}
        onClose={() => setIsBidHistoryOpen(false)}
        productId={product._id}
        productName={product.name}
      />

      {/* Product Description - Move down to appear after all primary info/actions */}
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-2">Description</h2>
        <div className="text-gray-700 whitespace-pre-line wrap-break-word">
          <ExpandableText text={product.description} />
        </div>
      </div>
      {product.descriptionHistory && product.descriptionHistory.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-lg font-semibold text-primary-blue">Updates</h3>
          {product.descriptionHistory.map((hist, index) => (
            <div
              key={index}
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
            >
              <p className="text-xs text-gray-500 mb-1 font-medium">
                {new Date(hist.updatedAt).toLocaleString()}
              </p>
              <div className="text-gray-700 whitespace-pre-line text-sm wrap-break-word">
                {hist.content.length > 200 ? (
                  <ExpandableText text={hist.content} limit={200} />
                ) : (
                  hist.content
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductInfoCard;
