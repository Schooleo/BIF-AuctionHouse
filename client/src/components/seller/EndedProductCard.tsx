import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Gavel,
  Trophy,
  History,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import type { Product } from "@interfaces/product";
import { sellerApi } from "@services/seller.api";
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
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="w-full md:w-48 h-48 relative bg-gray-100 shrink-0">
          <img
            src={product.mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Clock size={12} /> Ended
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {product.name}
            </h3>
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

            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Trophy size={12} />{" "}
                {product.winnerConfirmed ? "Winner" : "Provisional Winner"}
              </h4>
              {product.currentBidder ? (
                <div className="text-sm font-medium text-gray-700">
                  {(typeof product.currentBidder === "object" &&
                    product.currentBidder?.name) ||
                    "Unknown User"}
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
                  No bids placed
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleViewHistory}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200 transition"
              title="View Bid History"
            >
              <History size={20} />
            </button>

            {product.currentBidder && !product.winnerConfirmed ? (
              <button
                onClick={handleConfirmWinner}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
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
            ) : (
              <button
                onClick={() =>
                  navigate("/seller/add-product", { state: { product } })
                }
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition"
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
