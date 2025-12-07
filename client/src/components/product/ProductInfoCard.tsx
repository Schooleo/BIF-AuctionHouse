import React, { useEffect, useState } from "react";
import type { Product } from "@interfaces/product";
import {
  formatPostedTime,
  timeRemaining,
  formatPrice,
  maskName,
} from "@utils/product";
import { Heart, Star, MessageCircle } from "lucide-react";
import { orderApi } from "@services/order.api";
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

import DOMPurify from "dompurify";
import { Link, useNavigate } from "react-router-dom";

const ExpandableText = ({
  content,
  maxHeight = 200,
}: {
  content: string;
  maxHeight?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      setShouldShowButton(contentRef.current.scrollHeight > maxHeight);
    }
  }, [content, maxHeight]);

  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-full" : ""
        }`}
        style={{ maxHeight: isExpanded ? "none" : `${maxHeight}px` }}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {!isExpanded && shouldShowButton && (
        <div className="absolute bottom-0 left-0 w-full h-12 bg-linear-gradient-to-t from-white to-transparent pointer-events-none" />
      )}

      {shouldShowButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary-blue hover:underline mt-2 font-medium block"
        >
          {isExpanded ? "See less" : "See more"}
        </button>
      )}
    </div>
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
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const addAlert = useAlertStore((state) => state.addAlert);

  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  const handleCompleteOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const order = await orderApi.createOrder(product._id);
      navigate(`/orders/${order._id}`);
    } catch (error) {
      console.error(error);
      addAlert("error", "Failed to open order page");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Compute auction state
  const now = new Date();
  const endTime = new Date(product.endTime);
  const isAuctionEnded = now > endTime;
  const isWinnerConfirmed = product.winnerConfirmed === true;
  const currentUserId = useAuthStore.getState().user?.id;
  const winnerId = product.currentBidder?._id || product.highestBidder?._id;
  const isCurrentUserWinner = isWinnerConfirmed && currentUserId === winnerId;

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      // Skip nếu là guest hoặc không có token
      if (isGuest || !token) {
        setIsInWatchlist(false);
        return;
      }

      try {
        const result = await bidderApi.checkInWatchlist(product._id, token);
        setIsInWatchlist(result.inWatchlist);
      } catch (error) {
        console.error("Failed to check watchlist status:", error);
        setIsInWatchlist(false);
      }
    };

    checkWatchlistStatus();
  }, [product._id, isGuest, token]);

  const handleAddToWatchlist = async () => {
    setIsAddingToWatchlist(true);
    try {
      if (!token) {
        addAlert("error", "You must be logged in to add to watchlist.");
        return;
      }

      await bidderApi.addToWatchlist(
        product._id,
        useAuthStore.getState().token || ""
      );
      setIsInWatchlist(true);
      addAlert("success", "Added to watchlist successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";

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

  const handleRemoveFromWatchlist = async () => {
    setIsAddingToWatchlist(true);
    try {
      if (!token) {
        addAlert("error", "You must be logged in to remove from watchlist.");
        return;
      }

      await bidderApi.removeFromWatchlist(product._id, token);

      setIsInWatchlist(false);

      addAlert("success", "Removed from watchlist successfully!");
    } catch (error: any) {
      const message = error.message || "Failed to remove from watchlist.";
      addAlert("error", message);
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handleCheckout = () => {
    addAlert(
      "info",
      "🚧 Checkout feature is currently under development. Stay tuned!"
    );
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-gray-500">
        Posted Time: {formatPostedTime(product.startTime)}
      </p>
      {isAuctionEnded ? (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-bold uppercase">
            Auction Ended
          </span>
          <p className="text-gray-600 text-sm">
            Ended {timeRemaining(product.endTime)}
          </p>
        </div>
      ) : (
        <p className="text-red-600 font-semibold">
          Time Remaining: {timeRemaining(product.endTime)}
        </p>
      )}
      <p className="text-xl font-semibold">
        {isAuctionEnded ? "Final Price" : "Current Price"}:{" "}
        {formatPrice(product.currentPrice)}
      </p>
      {product.buyNowPrice && (
        <p className="text-lg text-green-600">
          Buy Now Price: {formatPrice(product.buyNowPrice)}
        </p>
      )}
      <p className="text-gray-700">
        Seller - {product.seller?.name || "Seller"} •{" "}
        <span className="text-yellow-500 inline-flex items-center gap-0.5">
          {Array.from({ length: Math.round(product.seller?.rating || 0) }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-500" />
          ))}{" "}
          <span className="ml-1">{product.seller?.rating?.toFixed(1) || "N/A"}</span>
        </span>
      </p>
      {isAuctionEnded ? (
        <div className="border-l-4 border-green-500 bg-green-50 px-4 py-3 rounded-md">
          {isWinnerConfirmed ? (
            isCurrentUserWinner ? (
              <div>
                <p className="text-green-700 font-bold text-lg">
                  Congratulations! You won this auction!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Please proceed to checkout to complete your purchase.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-green-700 font-semibold">
                  Winner:{" "}
                  {maskName(
                    product.currentBidder?.name ||
                      product.highestBidder?.name ||
                      "Anonymous"
                  )}
                </p>
                {(product.currentBidder?.rating ||
                  product.highestBidder?.rating) && (
                  <span className="text-yellow-500 text-sm inline-flex items-center gap-0.5">
                    {Array.from({
                      length: Math.round(
                        product.currentBidder?.rating ||
                          product.highestBidder?.rating ||
                          0
                      ),
                    }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-500" />
                    ))}{" "}
                    <span className="ml-1">
                      {(
                        product.currentBidder?.rating ||
                        product.highestBidder?.rating
                      )?.toFixed(1)}
                    </span>
                  </span>
                )}
              </div>
            )
          ) : (
            <div>
              <p className="text-orange-700 font-semibold">
                Awaiting winner confirmation...
              </p>
              <p className="text-orange-600 text-sm mt-1">
                The seller is reviewing the final bid. This usually takes 1-2
                business days.
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-700">
          Current Highest Bidder -{" "}
          {product.bidCount > 0 ? (
            <>
              {maskName(
                product.highestBidder?.name ||
                  product.currentBidder?.name ||
                  "Anonymous"
              )}{" "}
              •{" "}
              <span className="text-yellow-500 inline-flex items-center gap-0.5">
                {Array.from({
                  length: Math.round(
                    product.highestBidder?.rating ||
                      product.currentBidder?.rating ||
                      0
                  ),
                }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500" />
                ))}{" "}
                <span className="ml-1">
                  {(
                    product.highestBidder?.rating ||
                    product.currentBidder?.rating ||
                    0
                  ).toFixed(1)}
                </span>
              </span>
            </>
          ) : (
            <span className="text-gray-500 italic">No bids yet</span>
          )}
        </p>
      )}
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
              onClick={
                isInWatchlist ? handleRemoveFromWatchlist : handleAddToWatchlist
              }
              disabled={isAuctionEnded}
              className={`${
                isAuctionEnded
                  ? "bg-gray-400 cursor-not-allowed opacity-50"
                  : isInWatchlist
                    ? "bg-gray-600 hover:scale-105"
                    : "bg-red-500 hover:scale-105"
              } rounded-2xl transition-transform duration-150 px-4 py-3 flex items-center gap-2`}
              title={
                isAuctionEnded
                  ? "Cannot modify watchlist for ended auctions"
                  : ""
              }
            >
              {isAddingToWatchlist ? (
                <>
                  <Spinner />
                  <span>Adding...</span>
                </>
              ) : isInWatchlist ? (
                <>
                  <Heart className="w-8 h-8" />
                  <span>Remove from Watchlist</span>
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
        {/* Complete Order for Winning Bidder */}
        {!isGuest &&
        new Date(product.endTime) <= new Date() &&
        (product.highestBidder?._id === user?.id ||
          // Fallback check if populated object has _id as string
          (typeof product.highestBidder === "object" &&
            product.highestBidder?._id?.toString() === user?.id)) ? (
          <button
            onClick={handleCompleteOrder}
            disabled={isCreatingOrder}
            className="text-xl font-semibold w-full px-6 py-4 rounded-2xl shadow-md bg-green-600 text-white hover:scale-105 transition-transform duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {isCreatingOrder ? (
              <>
                <Spinner /> Processing...
              </>
            ) : (
              <>
                <MessageCircle size={24} /> Complete Purchase & Chat
              </>
            )}
          </button>
        ) : isGuest ? (
          <Link
            to="/auth/login"
            className={`text-xl font-semibold w-full px-6 py-4 rounded-2xl shadow-md ${
              isAuctionEnded
                ? "bg-gray-400 cursor-not-allowed opacity-50 pointer-events-none"
                : "bg-primary-blue hover:scale-105"
            } text-white transition-transform duration-200 text-center block`}
          >
            {isAuctionEnded ? "Auction Ended" : "Sign In to Start Bidding"}
          </Link>
        ) : isAuctionEnded ? (
          isCurrentUserWinner ? (
            <button
              onClick={handleCheckout}
              className="text-xl font-semibold w-full px-6 py-3 rounded-2xl shadow-md bg-green-600 text-white hover:scale-105 transition-transform duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
            </button>
          ) : (
            <button
              disabled
              className="text-xl font-semibold w-full px-6 py-3 rounded-2xl shadow-md bg-gray-400 text-gray-200 cursor-not-allowed opacity-50"
            >
              Auction Ended
            </button>
          )
        ) : (
          <button
            onClick={() => setIsBidModalOpen(true)}
            className="text-xl font-semibold w-full px-6 py-3 rounded-2xl shadow-md bg-primary-blue text-white hover:scale-105 transition-transform duration-200 cursor-pointer"
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
        <div className="text-gray-700 p-0 prose prose-sm max-w-none wrap-break-word overflow-hidden">
          <ExpandableText content={product.description} />
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
              <div className="text-gray-700 text-sm p-0 prose prose-sm max-w-none wrap-break-word overflow-hidden">
                <ExpandableText content={hist.content} maxHeight={100} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductInfoCard;
