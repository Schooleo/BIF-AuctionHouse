import React, { useState } from "react";
import { Check } from "lucide-react";
import { orderApi } from "@services/order.api";
import type { Order } from "@interfaces/order";
import { useAlertStore } from "@stores/useAlertStore";
import ImageUpload from "@components/shared/ImageUpload";
import ImageModal from "@components/ui/ImageModal";

interface Step2Props {
  order: Order;
  isSeller: boolean;
  onUpdate: (order: Order) => void;
}

const Step2Shipping: React.FC<Step2Props> = ({ order, isSeller, onUpdate }) => {
  const [shippingProof, setShippingProof] = useState(order.shippingProof || "");
  const [note, setNote] = useState(order.sellerNote || "");
  const [loading, setLoading] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const addAlert = useAlertStore((state) => state.addAlert);

  const handleSubmit = async () => {
    if (!shippingProof)
      return addAlert("error", "Please provide shipping proof");
    setLoading(true);
    try {
      const updated = await orderApi.updateStep2(order._id, {
        shippingProof,
        note,
        confirmPayment: true, // Assume implied by shipping
      });
      onUpdate(updated);
      addAlert("success", "Shipping details submitted successfully");
    } catch (error) {
      console.error(error);
      addAlert("error", "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  if (!isSeller) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">
          Processing Order
        </h3>
        <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
          Seller is reviewing your payment and preparing shipment.
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <p className="font-medium text-gray-500">Shipping To:</p>
            <p>{order.shippingAddress}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Payment Status:</p>
            <p
              className={
                order.status === "PAID_CONFIRMED"
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {order.status === "PAID_CONFIRMED"
                ? "Confirmed"
                : "Pending Review"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Fulfill Order</h3>
        <p className="text-sm text-gray-500">
          Confirm payment and provide shipping details/tracking.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium mb-2 text-sm">Bidder Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <span className="text-gray-500">Address:</span>{" "}
            {order.shippingAddress}
          </p>
          <p>
            <span className="text-gray-500">Note:</span>{" "}
            {order.buyerNote || "None"}
          </p>
        </div>
        {order.paymentProof && (
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500 block mb-1">
              Payment Proof:
            </span>
            <div
              className="cursor-pointer hover:opacity-90 transition-opacity w-fit"
              onClick={() => setViewImage(order.paymentProof as string)}
            >
              <img
                src={order.paymentProof}
                alt="Payment"
                className="h-24 object-contain border rounded bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Proof / Tracking Image
          </label>
          <div onClick={() => shippingProof && setViewImage(shippingProof)}>
            <ImageUpload
              value={shippingProof}
              onChange={setShippingProof}
              onRemove={() => setShippingProof("")}
              placeholder="Upload shipping receipt"
              height="h-40"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload a photo of the shipping receipt or tracking label. Click to
            view larger.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note to Buyer (Tracking Code)
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tracking number or instructions..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !shippingProof}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <Check size={18} /> Confirm Payment & Ship
            </>
          )}
        </button>
      </div>

      <ImageModal
        isOpen={!!viewImage}
        onClose={() => setViewImage(null)}
        imageUrl={viewImage || ""}
        altText="Proof Image"
      />
    </div>
  );
};

export default Step2Shipping;
