import React, { useState, useEffect } from "react";
import { Trophy, XCircle, Box, ThumbsUp, Settings2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Product, UserSummary } from "@interfaces/product";
import { sellerApi } from "@services/seller.api";
import { orderApi } from "@services/order.api";
import { formatPrice } from "@utils/product";
import RateBidderModal from "./RateBidderModal";

import ConfirmationModal from "@components/ui/ConfirmationModal";
import PostCancelModal from "./PostCancelModal";
import { useAlertStore } from "@stores/useAlertStore";
import type { Order } from "@interfaces/order";

interface BidWinnerCardProps {
  product: Product;
  onRefresh: () => void;
}

const BidWinnerCard: React.FC<BidWinnerCardProps> = ({
  product,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const addAlert = useAlertStore((state) => state.addAlert);
  const [order, setOrder] = useState<Order | null>(
    !product.winnerConfirmed && product.latestOrder
      ? (product.latestOrder as Order)
      : null
  );
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPostCancelModalOpen, setIsPostCancelModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      // If we already have the latest order (e.g. from Decide Later), use it
      if (!product.winnerConfirmed) {
        if (product.latestOrder && !order) {
          setOrder(product.latestOrder as unknown as Order);
        }
        return;
      }

      try {
        const data = await orderApi.createOrder(product._id);
        setOrder(data);
      } catch (error) {
        console.error("Failed to load order status", error);
      }
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleChatOrder = async () => {
    if (!product.winnerConfirmed) {
      if (order?.status === "CANCELLED") {
        navigate(`/seller/orders/${order._id}`);
        return;
      }
      setIsPostCancelModalOpen(true);
      return;
    }

    if (order) {
      navigate(`/seller/orders/${order._id}`);
    } else {
      try {
        setLoading(true);
        const newOrder = await orderApi.createOrder(product._id);
        navigate(`/seller/orders/${newOrder._id}`);
      } catch (error) {
        console.error(error);
        addAlert("error", "Failed to open order");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRateSubmit = async (score: 1 | -1, comment: string) => {
    try {
      setLoading(true);
      await sellerApi.rateWinner(product._id, score, comment);
      addAlert("success", "Rating submitted successfully");
      setIsRateModalOpen(false);
      onRefresh();
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message || "Failed to submit rating";
      addAlert("error", message);
    } finally {
      setLoading(false);
    }
  };

  // Local state to hold the most up-to-date product info (for the modal)
  const [effectiveProduct, setEffectiveProduct] = useState(product);
  // Hold the bidder who was just cancelled so we can show them crossed out
  const [cancelledBidder, setCancelledBidder] = useState<UserSummary | null>(
    null
  );

  useEffect(() => {
    setEffectiveProduct(product);
    setCancelledBidder(null);
  }, [product]);

  const handleCancelCheckout = async () => {
    try {
      setLoading(true);
      const updatedProduct = await sellerApi.cancelTransaction(product._id);

      // Save the bidder we just cancelled so we can display them as rejected
      setCancelledBidder((product.currentBidder as UserSummary) || null);

      addAlert("success", "Transaction cancelled successfully");
      setIsCancelModalOpen(false);

      // Update local state so modal sees the new bidCount (e.g. 0)
      setEffectiveProduct(updatedProduct);

      // Re-fetch the order to get the updated status (CANCELLED) and ratings
      // Do NOT call createOrder here, as it might create a new order for the next bidder prematurely.
      // We know the action was cancellation, so we just set the local state to reflect that.
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));

      setIsPostCancelModalOpen(true);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        "Failed to cancel transaction";
      addAlert("error", message);
    } finally {
      setLoading(false);
    }
  };

  // Determine if rated using product data (populated by backend) OR order data
  const hasRating = !!effectiveProduct.sellerRating || !!order?.ratingBySeller;
  const ratingScore =
    effectiveProduct.sellerRating?.score || order?.ratingBySeller?.score;

  // Determine effective bidder to display:
  const displayedBidder = cancelledBidder || effectiveProduct.currentBidder;

  const isDisplayingRejected =
    !!cancelledBidder ||
    order?.status === "CANCELLED" ||
    (displayedBidder &&
      effectiveProduct.rejectedBidders?.includes(
        typeof displayedBidder === "object"
          ? displayedBidder._id
          : (displayedBidder as string)
      ));

  // For "Decide Later" state: if no cancelledBidder locally, try to get from order
  useEffect(() => {
    if (
      !product.winnerConfirmed &&
      product.latestOrder?.status === "CANCELLED" &&
      !cancelledBidder
    ) {
      if (product.latestOrder.buyer) {
        setCancelledBidder(product.latestOrder.buyer as UserSummary);
      }
    }
  }, [product, cancelledBidder]);

  const bidderName =
    (typeof displayedBidder === "object" && displayedBidder?.name) || "Unknown";
  const bidderRating =
    (typeof displayedBidder === "object" &&
      displayedBidder?.rating?.toFixed(1)) ||
    "N/A";

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 xl:grid-cols-[0.8fr_auto_1.2fr] items-center gap-6 relative group border border-gray-100 hover:border-blue-100 transition-all">
        {/* LEFT: Image & Product Info */}
        <div className="flex items-center gap-6">
          {/* Image */}
          <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative shadow-sm border border-gray-100">
            <img
              src={product.mainImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {(order?.status === "CANCELLED" || !!cancelledBidder) && (
              <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 z-10 w-fit">
                Cancelled
              </div>
            )}
          </div>

          {/* Product Info (Name & Price) */}
          <div className="min-w-0 max-w-[180px]">
            <h3
              className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate block"
              title={product.name}
            >
              <Link
                to={`/seller/products/${product._id}`}
                className="hover:text-blue-600 transition"
              >
                {product.name}
              </Link>
            </h3>
            <div className="text-green-600 font-bold text-base">
              {formatPrice(product.currentPrice)}
            </div>
          </div>
        </div>

        {/* CENTER: Winner Info */}
        <div className="flex justify-start w-full pl-4">
          <div className="flex items-center gap-4 shrink-0">
            <div
              className={`p-3 rounded-full shrink-0 border border-yellow-100 ${
                isDisplayingRejected
                  ? "bg-gray-100 text-gray-400"
                  : "bg-yellow-50 text-yellow-600"
              }`}
            >
              {isDisplayingRejected ? (
                <XCircle size={28} />
              ) : (
                <Trophy size={28} />
              )}
            </div>
            <div className="flex flex-col">
              <p
                className={`font-bold text-lg text-gray-900 truncate ${
                  isDisplayingRejected
                    ? "text-gray-400 line-through decoration-red-500"
                    : "text-gray-900"
                }`}
                title={bidderName}
              >
                {bidderName}
              </p>
              {isDisplayingRejected ? (
                <span className="text-red-500 text-xs font-bold">Rejected</span>
              ) : (
                <span className="text-sm text-gray-500 font-medium">
                  Rating:{" "}
                  <span className="text-gray-700 font-bold">
                    {bidderRating}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex flex-col md:flex-row justify-end gap-3 w-full">
          <button
            onClick={handleChatOrder}
            disabled={loading}
            className={`px-5 py-3 text-white text-sm rounded-lg flex items-center justify-center gap-2 transition font-bold shadow-sm relative whitespace-nowrap min-w-[140px] flex-1 md:flex-none ${
              order?.status === "COMPLETED" || order?.status === "CANCELLED"
                ? "bg-gray-600 hover:bg-gray-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title="Open Order & Chat"
          >
            <Box size={20} />
            {product.winnerConfirmed
              ? !order
                ? "Loading..."
                : order.status === "CANCELLED"
                  ? "Order Cancelled"
                  : order.status === "COMPLETED"
                    ? "Order Completed"
                    : order.step === 1
                      ? "Step 1: Payment"
                      : order.step === 2
                        ? "Step 2: Shipping"
                        : order.step === 3
                          ? "Step 3: Receipt"
                          : order.step === 4
                            ? hasRating
                              ? "Rating Submitted"
                              : "Step 4: Rating"
                            : "Open Order"
              : order?.status === "CANCELLED"
                ? "Cancelled Order"
                : "Action Required"}

            {/* Alert Marker Logic */}
            {order &&
              order.status !== "CANCELLED" &&
              order.status !== "COMPLETED" &&
              (order.step === 2 || (order.step === 4 && !hasRating)) && (
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white absolute top-2 right-2 animate-pulse shadow-sm" />
              )}
          </button>

          <button
            onClick={() => setIsRateModalOpen(true)}
            className={`px-4 py-3 text-sm rounded-lg border flex items-center justify-center gap-1.5 transition font-bold shadow-sm whitespace-nowrap min-w-[100px] flex-1 md:flex-none ${
              hasRating
                ? ratingScore === 1
                  ? "bg-green-50 text-green-700 border-green-200"
                  : ratingScore === -1
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 from-neutral-50"
            }`}
          >
            <ThumbsUp
              size={18}
              className={hasRating && ratingScore === 1 ? "fill-current" : ""}
            />
            {hasRating ? "Rated" : "Rate"}
          </button>

          {!product.winnerConfirmed ||
          (order && order.status === "CANCELLED") ? (
            <button
              onClick={() => {
                if (product.bidCount === 0) {
                  addAlert(
                    "warning",
                    "The product ended with 0 bids! Consider reposting in Ended Auctions"
                  );
                }
                setIsPostCancelModalOpen(true);
              }}
              className="px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 text-sm rounded-lg flex items-center justify-center gap-1.5 transition font-bold shadow-sm text-center leading-tight whitespace-nowrap min-w-[100px] flex-1 md:flex-none"
            >
              <Settings2 size={18} />
              Option
            </button>
          ) : (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              disabled={loading || order?.status === "COMPLETED"}
              className="px-4 py-3 bg-white border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-sm rounded-lg flex items-center justify-center gap-1.5 transition font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px] flex-1 md:flex-none"
            >
              <XCircle size={18} /> Cancel
            </button>
          )}
        </div>

        <RateBidderModal
          isOpen={isRateModalOpen}
          onClose={() => setIsRateModalOpen(false)}
          onSubmit={handleRateSubmit}
          loading={loading}
          bidderName={bidderName} 
          initialScore={
            (product.sellerRating?.score as 1 | -1) ||
            order?.ratingBySeller?.score
          }
          initialComment={
            product.sellerRating?.comment || order?.ratingBySeller?.comment
          }
        />

        <ConfirmationModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleCancelCheckout}
          title="Cancel Transaction?"
          message="Are you sure you want to cancel this transaction? This action will auto-rate the user negatively and remove them as the winner."
          confirmText="Yes, Cancel"
          cancelText="No, Keep"
          type="danger"
        />

        <PostCancelModal
          isOpen={isPostCancelModalOpen}
          onClose={() => {
            setIsPostCancelModalOpen(false);
            onRefresh(); // Refresh when fully closed
          }}
          product={effectiveProduct}
          onRefresh={onRefresh}
        />
      </div>
    </>
  );
};

export default BidWinnerCard;
