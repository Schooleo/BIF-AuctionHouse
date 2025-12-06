import React, { useState } from "react";
import { UserPlus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sellerApi } from "@services/seller.api";
import { useAlertStore } from "@stores/useAlertStore";
import PopUpWindow from "@components/ui/PopUpWindow";

interface PostCancelModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const PostCancelModal: React.FC<PostCancelModalProps> = ({
  productId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const addAlert = useAlertStore((state) => state.addAlert);
  const [loading, setLoading] = useState(false);

  const handleSelectNextWinner = async () => {
    try {
      setLoading(true);
      await sellerApi.confirmWinner(productId);
      addAlert("success", "Next highest bidder confirmed!");
      onClose();
      onRefresh();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message;
      if (message === "No eligible bidder found") {
        addAlert(
          "warning",
          "No other bidders available. You may need to repost."
        );
      } else {
        addAlert("error", message || "Failed to select next winner");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRepost = () => {
    navigate("/seller/add-product");
    onClose();
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Cancelled"
      size="md"
    >
      <div className="p-4">
        <p className="text-gray-600 mb-6">
          The transaction has been cancelled. What would you like to do next?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleSelectNextWinner}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 border-2 border-blue-50 bg-blue-50/50 rounded-xl hover:bg-blue-100 hover:border-blue-200 transition gap-3 group"
          >
            <div className="p-3 bg-white rounded-full shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
              <UserPlus size={24} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-800">Select Next Winner</h4>
              <p className="text-xs text-gray-500 mt-1">
                Offer to the next highest bidder if available
              </p>
            </div>
          </button>

          <button
            onClick={handleRepost}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 bg-gray-50 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition gap-3 group"
          >
            <div className="p-3 bg-white rounded-full shadow-sm text-gray-600 group-hover:scale-110 transition-transform">
              <RefreshCw size={24} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-800">Repost Product</h4>
              <p className="text-xs text-gray-500 mt-1">
                Create a new auction for this item
              </p>
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Decide Later
          </button>
        </div>
      </div>
    </PopUpWindow>
  );
};

export default PostCancelModal;
