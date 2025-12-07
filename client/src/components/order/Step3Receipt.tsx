import React, { useState } from "react";
import { PackageCheck } from "lucide-react";
import { orderApi } from "@services/order.api";
import type { Order } from "@interfaces/order";
import { useAlertStore } from "@stores/useAlertStore";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import ImageModal from "@components/ui/ImageModal";

interface Step3Props {
  order: Order;
  isBuyer: boolean;
  onUpdate: (order: Order) => void;
}

const Step3Receipt: React.FC<Step3Props> = ({ order, isBuyer, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const addAlert = useAlertStore((state) => state.addAlert);

  const handleConfirmReceipt = async () => {
    setLoading(true);
    try {
      const updated = await orderApi.updateStep3(order._id);
      onUpdate(updated);
      addAlert("success", "Receipt confirmed!");
    } catch (error) {
      console.error(error);
      addAlert("error", "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  if (!isBuyer) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Completed Shipment
        </h3>
        <div className="bg-green-50 p-4 rounded text-sm text-green-800">
          Item has been marked as shipped. Waiting for bidder to confirm
          receipt.
        </div>
        {order.shippingProof && (
          <div className="mt-2">
            <span className="text-xs font-medium text-gray-500 block mb-1">
              Your Shipping Proof:
            </span>
            <div
              className="cursor-pointer hover:opacity-90 transition-opacity w-fit"
              onClick={() => setViewImage(order.shippingProof as string)}
            >
              <img
                src={order.shippingProof}
                alt="Proof"
                className="h-32 object-contain border rounded bg-white"
              />
            </div>
          </div>
        )}
        <ImageModal
          isOpen={!!viewImage}
          onClose={() => setViewImage(null)}
          imageUrl={viewImage || ""}
          altText="Shipping Proof"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Confirm Receipt</h3>
        <p className="text-sm text-gray-500">
          Seller has shipped the item. Confirm when you receive it.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium mb-2 text-sm">Shipment Details</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <span className="text-gray-500">Note:</span>{" "}
            {order.sellerNote || "None"}
          </p>
        </div>
        {order.shippingProof && (
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500 block mb-1">
              Shipping Proof:
            </span>
            <div
              className="cursor-pointer hover:opacity-90 transition-opacity w-fit"
              onClick={() => setViewImage(order.shippingProof as string)}
            >
              <img
                src={order.shippingProof}
                alt="Shipment"
                className="h-40 object-contain border rounded bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsConfirmModalOpen(true)}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? (
          "Processing..."
        ) : (
          <>
            <PackageCheck size={20} /> I Have Received The Item
          </>
        )}
      </button>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmReceipt}
        title="Confirm Receipt"
        message="Are you sure you have received the item? This action will mark the order as received and allow both parties to rate each other."
        confirmText="Yes, I Received It"
        cancelText="Cancel"
        type="success"
      />

      <ImageModal
        isOpen={!!viewImage}
        onClose={() => setViewImage(null)}
        imageUrl={viewImage || ""}
        altText="Shipping Proof"
      />
    </div>
  );
};

export default Step3Receipt;
