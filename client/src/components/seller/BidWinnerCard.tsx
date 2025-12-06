import React, { useState } from "react";
import { Trophy, Settings, ThumbsUp, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "@interfaces/product";
import { sellerApi } from "@services/seller.api";
import { formatPrice } from "@utils/product";
import ManageTransactionModal from "./ManageTransactionModal";
import RateBidderModal from "./RateBidderModal";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import PostCancelModal from "./PostCancelModal";
import { useAlertStore } from "@stores/useAlertStore";

interface BidWinnerCardProps {
  product: Product;
  onRefresh: () => void;
}

const BidWinnerCard: React.FC<BidWinnerCardProps> = ({
  product,
  onRefresh,
}) => {
  const addAlert = useAlertStore((state) => state.addAlert);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPostCancelModalOpen, setIsPostCancelModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handlers for direct actions
  const handleRateSubmit = async (score: 1 | -1, comment: string) => {
    try {
      setLoading(true);
      await sellerApi.rateWinner(product._id, score, comment);
      addAlert("success", "Rating submitted successfully");
      setIsRateModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Failed to submit rating";
      addAlert("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCheckout = async () => {
    try {
      setLoading(true);
      await sellerApi.cancelTransaction(product._id);
      addAlert("success", "Transaction cancelled successfully");
      setIsCancelModalOpen(false);
      setIsPostCancelModalOpen(true);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        "Failed to cancel transaction";
      addAlert("error", message);
      setLoading(false);
    }
  };

  const isRated = product.isRatedBySeller;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        {/* Basic Info - Single Row */}
        <div className="w-28 h-28 bg-gray-100 rounded-lg overflow-hidden shrink-0 group border border-gray-200">
          <Link
            to={`/seller/products/${product._id}`}
            className="block w-full h-full"
          >
            <img
              src={product.mainImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-6 items-center w-full">
          {/* Product Name & Price */}
          <div className="col-span-1 text-center sm:text-left flex flex-col justify-center h-full">
            <Link
              to={`/seller/products/${product._id}`}
              className="hover:underline"
            >
              <h3
                className="font-bold text-gray-800 text-xl mb-1 line-clamp-2"
                title={product.name}
              >
                {product.name}
              </h3>
            </Link>
            <p className="text-lg text-gray-500">
              <span className="font-bold text-green-700">
                {formatPrice(product.currentPrice)}
              </span>
            </p>
          </div>

          {/* Winner Info */}
          <div className="col-span-1 flex items-center justify-center sm:justify-start gap-4 h-full">
            <div className="p-3 bg-yellow-50 rounded-full text-yellow-600 shrink-0 border border-yellow-100">
              <Trophy size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-yellow-800 uppercase font-bold tracking-wide mb-0.5">
                Winner
              </p>
              <p
                className="text-lg font-bold text-gray-900 truncate"
                title={
                  (typeof product.currentBidder === "object" &&
                    product.currentBidder?.name) ||
                  "Unknown"
                }
              >
                {(typeof product.currentBidder === "object" &&
                  product.currentBidder?.name) ||
                  "Unknown"}
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="col-span-1 flex flex-col gap-3 min-w-[180px] h-full justify-center">
            <button
              onClick={() => setIsManageModalOpen(true)}
              className="w-full px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-base rounded-lg flex items-center justify-center gap-2 transition font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Settings size={18} /> Manage Transaction
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setIsRateModalOpen(true)}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border flex items-center justify-center gap-2 transition whitespace-nowrap font-medium ${
                  isRated
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-blue-600"
                }`}
                title={isRated ? "Update Rating" : "Rate Bidder"}
              >
                <ThumbsUp size={16} className={isRated ? "fill-current" : ""} />
                {isRated ? "Rated" : "Rate"}
              </button>

              <button
                onClick={() => setIsCancelModalOpen(true)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm rounded-lg flex items-center justify-center gap-2 transition whitespace-nowrap font-medium"
                title="Cancel Checkout"
              >
                <XCircle size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>

        <ManageTransactionModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          product={product}
          onRefresh={onRefresh}
        />

        <RateBidderModal
          isOpen={isRateModalOpen}
          onClose={() => setIsRateModalOpen(false)}
          onSubmit={handleRateSubmit}
          loading={loading}
          bidderName={
            (typeof product.currentBidder === "object" &&
              product.currentBidder?.name) ||
            "Bidder"
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
          productId={product._id}
          onRefresh={onRefresh}
        />
      </div>
    </>
  );
};

export default BidWinnerCard;
