import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  Gavel,
  Trophy,
  History,
  CheckCircle,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import type { Product } from "@interfaces/product";
import { sellerApi } from "@services/seller.api";
import { orderApi } from "@services/order.api";
import { formatPrice } from "@utils/product";
import SellerBidHistoryModal from "./SellerBidHistoryModal";
import { useAlertStore } from "@stores/useAlertStore";

interface EndedProductCardProps {
  product: Product;
  onRefresh: () => void;
}

const EndedProductCard: React.FC<EndedProductCardProps> = ({
  product,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const addAlert = useAlertStore((state) => state.addAlert);
  const [loading, setLoading] = useState(false);

  const currentBidderId =
    typeof product.currentBidder === "object"
      ? product.currentBidder?._id
      : product.currentBidder;

  const isRejected =
    product.currentBidder &&
    product.rejectedBidders?.includes(currentBidderId || "");

  const handleChatOrder = async () => {
    try {
      setLoading(true);
      const order = await orderApi.createOrder(product._id);
      navigate(`/seller/orders/${order._id}`);
    } catch (error) {
      console.error(error);
      addAlert("error", "Failed to open order");
    } finally {
      setLoading(false);
    }
  };

  // Bid History Logic
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false);
  const [rejectingBidderId, setRejectingBidderId] = useState<string | null>(
    null
  );

  const handleConfirmWinner = async () => {
    try {
      setLoading(true);
      await sellerApi.confirmWinner(product._id);
      addAlert("success", "Winner confirmed successfully");
      onRefresh(); // Refresh parent list to move this to "Completed"
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Failed to confirm winner";
      addAlert("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    setIsBidHistoryOpen(true);
  };

  const handleRejectBidder = async (bidderId: string) => {
    try {
      setRejectingBidderId(bidderId);
      await sellerApi.rejectBidder(product._id, bidderId);
      addAlert("success", "Bidder rejected successfully");
      onRefresh(); // Refresh to update product state (new winner or no winner)
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Failed to reject bidder";
      addAlert("error", message);
    } finally {
      setRejectingBidderId(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col sm:flex-row items-center gap-5">
        {/* Image Section */}
        <Link
          to={`/seller/products/${product._id}`}
          className="w-44 h-44 relative bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 group"
        >
          <img
            src={product.mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-1 left-1 bg-gray-900/80 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <Clock size={10} /> Ended
          </div>
        </Link>

        {/* Content Section */}
        <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-auto gap-4">
          <div>
            <Link
              to={`/seller/products/${product._id}`}
              className="text-lg font-bold text-gray-800 mb-1 line-clamp-1 hover:text-blue-700 transition-colors duration-300"
              title={product.name}
            >
              {product.name}
            </Link>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Gavel size={14} /> {product.bidCount} Bids
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-green-700">
                  {formatPrice(product.currentPrice)}
                </span>
              </span>
            </div>

            <div
              className={`p-2.5 rounded-md border inline-block min-w-0 w-full ${
                !product.currentBidder
                  ? "bg-gray-50 border-gray-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <h4
                className={`text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1 ${
                  !product.currentBidder ? "text-gray-600" : "text-blue-800"
                }`}
              >
                {product.currentBidder && <Trophy size={12} />}{" "}
                {!product.currentBidder
                  ? "No bids placed"
                  : product.winnerConfirmed
                    ? "Final Winner"
                    : isRejected
                      ? "Rejected Bidder"
                      : "Provisional Winner"}
              </h4>
              {product.currentBidder ? (
                <div className="text-sm font-medium text-gray-700">
                  <span
                    className={isRejected ? "text-red-600 line-through" : ""}
                  >
                    {(typeof product.currentBidder === "object" &&
                      product.currentBidder?.name) ||
                      "Unknown User"}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">
                    (Rating:{" "}
                    {(typeof product.currentBidder === "object" &&
                      product.currentBidder?.rating?.toFixed(1)) ||
                      "N/A"}
                    )
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Please consider reposting
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handleViewHistory}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
              title="View Bid History"
            >
              <History size={20} />
            </button>

            {product.currentBidder &&
            !product.winnerConfirmed &&
            product.bidCount > 0 ? (
              <button
                onClick={handleConfirmWinner}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <span>Confirming...</span>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm Winner
                  </>
                )}
              </button>
            ) : product.winnerConfirmed ? (
              <button
                onClick={handleChatOrder}
                className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <MessageCircle size={18} />
                Order & Chat
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await sellerApi.archiveCancelledProduct(product._id);
                    navigate("/seller/add-product", { state: { product } });
                    onRefresh();
                  } catch (error) {
                    console.error("Failed to archive product:", error);
                    // Still navigate even if archive fails, so user can at least repost
                    navigate("/seller/add-product", { state: { product } });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} />
                Repost Product
              </button>
            )}
          </div>
        </div>
      </div>

      <SellerBidHistoryModal
        productId={product._id}
        isOpen={isBidHistoryOpen}
        onClose={() => setIsBidHistoryOpen(false)}
        onRejectBidder={handleRejectBidder}
        rejectedBidderIds={product.rejectedBidders ?? []}
        currentBidderId={
          typeof product.currentBidder === "object"
            ? product.currentBidder?._id
            : undefined
        }
        rejectingBidderId={rejectingBidderId}
        winnerConfirmed={Boolean(product.winnerConfirmed)}
      />
    </>
  );
};

export default EndedProductCard;
