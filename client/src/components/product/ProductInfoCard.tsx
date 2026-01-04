import { useEffect, useState, useCallback, useRef } from "react";
import type { Product } from "@interfaces/product";
import {
  formatPostedTime,
  timeRemaining,
  formatPrice,
  maskName,
} from "@utils/product";
import { Heart, Star, ArrowRight, ShieldX } from "lucide-react";
import { orderApi } from "@services/order.api";
import Spinner from "@components/ui/Spinner";
import AutoBidModal from "./AutoBidModal";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import BidHistoryModal from "./BidHistoryModal";
import UserRatingDetailsModal from "@components/user/UserRatingDetailsModal";
import { useAlertStore } from "@stores/useAlertStore";
import { useSocket } from "@contexts/SocketContext";
import DOMPurify from "dompurify";
import { Link, useNavigate } from "react-router-dom";

interface ProductInfoCardProps {
  product: Product;
  isGuest: boolean;
  onUpdateProduct?: (updatedProduct: Product) => void;
}

interface BidUpdateData {
  currentPrice: number;
  bidCount: number;
  currentBidder: string;
  currentBidderRating: number;
  endTime: string;
}

const ExpandableText = ({
  content,
  maxHeight = 200,
}: {
  content: string;
  maxHeight?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setShouldShowButton(contentRef.current.scrollHeight > maxHeight);
    }
  }, [content, maxHeight]);

  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-full" : ""}`}
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
  product: initialProduct,
  isGuest,
  onUpdateProduct,
}) => {
  const [product, setProduct] = useState(initialProduct);
  const [isAutoBidModalOpen, setIsAutoBidModalOpen] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [myAutoBidMax, setMyAutoBidMax] = useState<number | null>(null);

  // Realtime state
  const [newBidsCount, setNewBidsCount] = useState(0);
  const [highlightBadge, setHighlightBadge] = useState(false);

  // Rating modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

  const addAlert = useAlertStore((state) => state.addAlert);
  const { token, user } = useAuthStore();
  const currentUserId = user?.id || "guest";
  const navigate = useNavigate();
  const { socket, joinProductRoom, leaveProductRoom } = useSocket();

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  // Load new bids count from localStorage on mount
  useEffect(() => {
    if (!product._id) return;
    const key = `lastAcknowledgedBidCount_${currentUserId}_${product._id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const lastCount = parseInt(stored, 10);
      const diff = product.bidCount - lastCount;
      if (diff > 0) {
        setNewBidsCount(diff);
      } else if (diff < 0) {
        // Data reset or weird state, reset storage
        localStorage.setItem(key, product.bidCount.toString());
        setNewBidsCount(0);
      } else {
        setNewBidsCount(0);
      }
    } else {
      // First visit, mark current as acknowledged
      localStorage.setItem(key, product.bidCount.toString());
      setNewBidsCount(0);
    }
  }, [product._id, product.bidCount, currentUserId]);

  // Socket Integration
  useEffect(() => {
    if (product._id) {
      joinProductRoom(product._id);

      if (socket) {
        socket.on("new_bid", (data: BidUpdateData) => {
          setProduct((prev) => ({
            ...prev,
            currentPrice: data.currentPrice,
            bidCount: data.bidCount,
            endTime: data.endTime,
            currentBidder: {
              ...prev.currentBidder,
              _id: "socket-update", // Dummy ID as we don't have it
              name: data.currentBidder, // Already masked
              rating: data.currentBidderRating,
              email: "",
              role: "bidder",
              isVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            highestBidder: undefined, // Clear highestBidder to prioritize currentBidder
          }));

          setHighlightBadge(true);
          setTimeout(() => setHighlightBadge(false), 500); // Animation duration
        });

        socket.on("bidder_rejected", (data: { bidderId: string }) => {
          if (data.bidderId === currentUserId) {
            // Force UI update for the rejected user
            setProduct((prev) => ({
              ...prev,
              rejectedBidders: [...(prev.rejectedBidders || []), currentUserId],
            }));
            addAlert("error", "You have been rejected by the seller.");
          }
        });
      }

      return () => {
        leaveProductRoom(product._id);
        if (socket) {
          socket.off("new_bid");
          socket.off("bidder_rejected");
        }
      };
    }
  }, [
    product._id,
    socket,
    joinProductRoom,
    leaveProductRoom,
    isBidHistoryOpen,
    currentUserId,
    addAlert,
  ]);

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
  const isBuyNowReached =
    !!product.buyNowPrice &&
    Math.round(product.currentPrice) >= Math.round(product.buyNowPrice);
  const isAuctionEnded = now > endTime || isBuyNowReached;
  const isWinnerConfirmed = product.winnerConfirmed === true;
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

  const checkAutoBidStatus = useCallback(async () => {
    if (isGuest || !token) {
      setMyAutoBidMax(null);
      return;
    }

    try {
      const data = await bidderApi.getSuggestedPrice(product._id, token);
      setMyAutoBidMax(data.myAutoBidMaxPrice || null);

      // If user has auto-bid, trust the server's lastViewedBidCount
      if (typeof data.myAutoBidLastViewedBidCount === "number") {
        const diff = product.bidCount - data.myAutoBidLastViewedBidCount;
        setNewBidsCount(Math.max(0, diff));
      }
    } catch (error) {
      console.error("Failed to check auto bid status", error);
    }
  }, [isGuest, token, product._id, product.bidCount]);

  useEffect(() => {
    checkAutoBidStatus();
  }, [checkAutoBidStatus]);

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
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to remove from watchlist.";
      addAlert("error", message);
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-full md:max-w-xl mx-auto md:mx-0">
      <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
      <p className="text-gray-500 text-sm md:text-base">
        Posted Time: {formatPostedTime(product.startTime)}
      </p>
      {isAuctionEnded ? (
        <p className="text-gray-600 text-sm">
          {timeRemaining(product.endTime)}
        </p>
      ) : (
        <p className="text-red-600 font-semibold text-base md:text-lg">
          Time Remaining: {timeRemaining(product.endTime)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-lg md:text-xl font-semibold">
          {isAuctionEnded ? "Final Price" : "Current Price"}:{" "}
          {formatPrice(product.currentPrice)}
        </p>
        {newBidsCount > 0 && (
          <span
            className={`px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold transition-transform duration-200 ${highlightBadge ? "scale-125" : "scale-100"}`}
          >
            {newBidsCount} New bids
          </span>
        )}
      </div>

      {product.buyNowPrice && (
        <p className="text-lg text-green-600">
          Buy Now Price: {formatPrice(product.buyNowPrice)}
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-gray-700">
          Seller - {product.seller?.name || "Seller"} •{" "}
          <span className="text-yellow-500 inline-flex items-center gap-0.5">
            {Array.from({
              length: Math.round(product.seller?.rating || 0),
            }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-500" />
            ))}{" "}
            <span className="ml-1">
              {product.seller?.rating?.toFixed(1) || "N/A"}
            </span>
          </span>
        </p>
        {!isGuest && product.seller?._id && (
          <button
            onClick={() => {
              setSelectedUserId(product.seller._id);
              setSelectedUserName(product.seller.name);
              setIsRatingModalOpen(true);
            }}
            className="text-xs px-2 py-1 bg-primary-blue text-white rounded-full hover:scale-105 transition-transform"
          >
            View Details
          </button>
        )}
      </div>
      {isAuctionEnded ? (
        <div className="border-l-4 border-green-500 bg-green-50 px-4 py-3 rounded-md text-left">
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
                <div className="flex items-center gap-2">
                  <p className="text-green-700 font-semibold">
                    Winner:{" "}
                    {isGuest ? (
                      maskName(
                        product.currentBidder?.name ||
                          product.highestBidder?.name ||
                          "Anonymous"
                      )
                    ) : user?.role === "seller" ? (
                      <button
                        onClick={() => {
                          const bidderId =
                            product.currentBidder?._id ||
                            product.highestBidder?._id;
                          const bidderName =
                            product.currentBidder?.name ||
                            product.highestBidder?.name;
                          if (bidderId) {
                            setSelectedUserId(bidderId);
                            setSelectedUserName(bidderName || null);
                            setIsRatingModalOpen(true);
                          }
                        }}
                        className="text-green-700 hover:underline hover:scale-105 transition-transform inline-block font-semibold"
                      >
                        {product.currentBidder?.name ||
                          product.highestBidder?.name ||
                          "Anonymous"}
                      </button>
                    ) : (
                      <span className="text-green-700 font-semibold">
                        {product.currentBidder?.name ||
                          product.highestBidder?.name ||
                          "Anonymous"}
                      </span>
                    )}
                  </p>
                </div>
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
              {isGuest ? (
                maskName(
                  product.highestBidder?.name ||
                    product.currentBidder?.name ||
                    "Anonymous"
                )
              ) : user?.role === "seller" ? (
                <button
                  onClick={() => {
                    const bidderId =
                      product.currentBidder?._id || product.highestBidder?._id;
                    const bidderName =
                      product.currentBidder?.name ||
                      product.highestBidder?.name;
                    if (bidderId) {
                      setSelectedUserId(bidderId);
                      setSelectedUserName(bidderName || null);
                      setIsRatingModalOpen(true);
                    }
                  }}
                  className="text-gray-700 hover:underline hover:scale-105 transition-transform inline-block hover:text-primary-blue"
                >
                  {product.highestBidder?.name ||
                    product.currentBidder?.name ||
                    "Anonymous"}
                </button>
              ) : (
                <span className="text-gray-700">
                  {product.highestBidder?.name ||
                    product.currentBidder?.name ||
                    "Anonymous"}
                </span>
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
      <div className="flex flex-col gap-4 mt-6 max-w-sm w-full">
        {/* Bid History & Watchlist (Logged in) */}
        {!isGuest && (
          <div className="flex items-center gap-4 text-white mb-2 w-full">
            {/* Bid History Link */}
            <button
              type="button"
              onClick={() => {
                setIsBidHistoryOpen(true);
                setNewBidsCount(0);

                // Update Local Storage (Fallback)
                localStorage.setItem(
                  `lastAcknowledgedBidCount_${currentUserId}_${product._id}`,
                  product.bidCount.toString()
                );

                // Update Server (Auto Bidder)
                if (token && myAutoBidMax) {
                  bidderApi
                    .acknowledgeAutoBid(product._id, token)
                    .catch(console.error);
                }
              }}
              className="relative bg-primary-blue rounded-2xl hover:scale-105 transition-transform duration-150 px-4 py-2 hover:cursor-pointer text-sm font-medium"
            >
              View Bid History
              {newBidsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
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
              } rounded-2xl transition-transform duration-150 px-4 py-2 flex items-center gap-2 text-sm font-medium`}
              title={
                isAuctionEnded
                  ? "Cannot modify watchlist for ended auctions"
                  : ""
              }
            >
              {isAddingToWatchlist ? (
                <>
                  <Spinner size={16} />
                  <span>Adding...</span>
                </>
              ) : isInWatchlist ? (
                <>
                  <Heart className="w-4 h-4" />
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
        {isGuest ? (
          <Link
            to="/auth/login"
            className={`text-xl font-semibold w-full px-6 py-4 rounded-2xl shadow-md ${
              isAuctionEnded
                ? "bg-gray-400 cursor-not-allowed opacity-50 pointer-events-none"
                : "bg-primary-blue hover:scale-105"
            } text-white transition-transform duration-200 text-center block`}
          >
            Sign In to Start Bidding
          </Link>
        ) : isAuctionEnded ? (
          isCurrentUserWinner ? (
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
                  Go to Order <ArrowRight size={24} />
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="text-xl font-semibold w-full px-6 py-3 rounded-2xl shadow-md bg-gray-400 text-gray-200 cursor-not-allowed opacity-50"
            >
              Waiting for Winner Confirmation
            </button>
          )
        ) : (
          <button
            onClick={() => setIsAutoBidModalOpen(true)}
            disabled={product.rejectedBidders?.includes(currentUserId)}
            className={`text-xl font-semibold w-full px-6 py-3 rounded-2xl shadow-md ${
              product.rejectedBidders?.includes(currentUserId)
                ? "bg-red-500 cursor-not-allowed opacity-80"
                : myAutoBidMax &&
                    Math.round(myAutoBidMax) > Math.round(product.currentPrice)
                  ? "bg-green-600 hover:bg-green-700 hover:cursor-pointer"
                  : "bg-primary-blue hover:scale-105 hover:cursor-pointer"
            } text-white transition-all duration-200 flex items-center justify-center gap-2`}
          >
            {product.rejectedBidders?.includes(currentUserId) ? (
              <>
                <ShieldX className="w-5 h-5" />
                Rejected by Seller
              </>
            ) : myAutoBidMax &&
              Math.round(myAutoBidMax) > Math.round(product.currentPrice) ? (
              "Auto Bidding..."
            ) : (
              "Set Auto Bid"
            )}
          </button>
        )}
      </div>

      <AutoBidModal
        isOpen={isAutoBidModalOpen}
        onClose={() => {
          setIsAutoBidModalOpen(false);
          checkAutoBidStatus();
        }}
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

      {selectedUserId && (
        <UserRatingDetailsModal
          isOpen={isRatingModalOpen}
          onClose={() => {
            setIsRatingModalOpen(false);
            setSelectedUserId(null);
            setSelectedUserName(null);
          }}
          userId={selectedUserId}
          userName={selectedUserName || undefined}
        />
      )}

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
