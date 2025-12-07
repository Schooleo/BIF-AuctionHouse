import React, { useState } from "react";
import { CheckCircle, ThumbsUp, XCircle, Info, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { sellerApi } from "@services/seller.api";
import { orderApi } from "@services/order.api"; // Import orderApi
import { useAlertStore } from "@stores/useAlertStore";
import PopUpWindow from "@components/ui/PopUpWindow";
import type { Product } from "@interfaces/product";
import { formatPrice } from "@utils/product";
import RateBidderModal from "./RateBidderModal";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import PostCancelModal from "./PostCancelModal";

interface ManageTransactionModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const ManageTransactionModal: React.FC<ManageTransactionModalProps> = ({
  product,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const addAlert = useAlertStore((state) => state.addAlert);
  const [loading, setLoading] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPostCancelModalOpen, setIsPostCancelModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleCompleteTransaction = async () => {
    try {
      setLoading(true);
      // Initialize or get existing order
      const order = await orderApi.createOrder(product._id);

      // Navigate to order completion page
      navigate(`/seller/orders/${order._id}`);
      onClose();
    } catch (err: unknown) {
      addAlert(
        "error",
        (err as { message?: string })?.message ||
          "Failed to initialize order transaction"
      );
    } finally {
      setLoading(false);
    }
  };

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
      // Open post-cancel modal
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
      <PopUpWindow
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Transaction"
        size="lg"
        hideSubmitButton={true}
      >
        <div className="p-6">
          {/* Transaction Info */}
          {/* Transaction Info */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg flex gap-4 items-start w-full">
              <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden shrink-0">
                <img
                  src={product.mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 line-clamp-2 mb-1">
                  {product.name}
                </h4>
                <p className="text-sm text-gray-500">
                  Final Price:{" "}
                  <span className="font-bold text-green-700">
                    {formatPrice(product.currentPrice)}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-800 rounded-lg">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Info size={16} /> Status
                </span>
                <span className="font-bold">Awaiting Completion</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 text-gray-700 rounded-lg">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Calendar size={16} /> Ended At
                </span>
                <span className="text-sm font-semibold">
                  {new Date(product.endTime).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleCompleteTransaction}
              disabled={loading}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition font-medium shadow-sm"
            >
              <CheckCircle size={18} /> Complete Transaction
            </button>

            <button
              onClick={() => setIsRateModalOpen(true)}
              disabled={loading}
              className={`px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition font-medium border ${
                isRated
                  ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
              }`}
            >
              <ThumbsUp size={18} className={isRated ? "fill-current" : ""} />
              {isRated ? "Update Rating" : "Rate Bidder"}
            </button>

            <button
              onClick={() => setIsCancelModalOpen(true)}
              disabled={loading}
              className="px-4 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2 transition font-medium"
            >
              <XCircle size={18} /> Cancel Transaction
            </button>
          </div>
        </div>
      </PopUpWindow>

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
          onClose(); // Close parent modal too
          onRefresh();
        }}
        product={product}
        onRefresh={onRefresh}
      />
    </>
  );
};

export default ManageTransactionModal;
