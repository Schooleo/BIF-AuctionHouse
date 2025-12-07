import React, { useState } from "react";
import { orderApi } from "@services/order.api";
import type { Order } from "@interfaces/order";
import { useAlertStore } from "@stores/useAlertStore";
import ImageUpload from "@components/shared/ImageUpload";
import ImageModal from "@components/ui/ImageModal";

interface Step1Props {
  order: Order;
  isBuyer: boolean;
  onUpdate: (order: Order) => void;
}

const Step1Payment: React.FC<Step1Props> = ({ order, isBuyer, onUpdate }) => {
  const [address, setAddress] = useState(order.shippingAddress || "");
  const [note, setNote] = useState(order.buyerNote || "");
  const [paymentProof, setPaymentProof] = useState(order.paymentProof || "");
  const [loading, setLoading] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const addAlert = useAlertStore((state) => state.addAlert);

  const handleSubmit = async () => {
    if (!address) return addAlert("error", "Please enter shipping address");
    if (!paymentProof)
      return addAlert("error", "Please provide proof of payment");

    setLoading(true);
    try {
      const updated = await orderApi.updateStep1(order._id, {
        address,
        note,
        paymentProof: paymentProof || undefined,
      });
      onUpdate(updated);
      addAlert("success", "Payment details submitted successfully");
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
          Waiting for Bidder
        </h3>
        <div className="bg-yellow-50 p-4 rounded text-sm text-yellow-800">
          Bidder is currently entering shipping address and payment details.
          Once they confirm, you will be notified.
        </div>
        {order.shippingAddress && (
          <div className="mt-4">
            <p className="font-medium">Shipping Address (Draft):</p>
            <p className="text-gray-600">{order.shippingAddress}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Shipping & Payment</h3>
        <p className="text-sm text-gray-500">
          Please provide delivery address and proof of payment.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Address
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address (Street, City, etc...)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Proof (Screenshot)
          </label>
          <div onClick={() => paymentProof && setViewImage(paymentProof)}>
            <ImageUpload
              value={paymentProof}
              onChange={setPaymentProof}
              onRemove={() => setPaymentProof("")}
              placeholder="Upload payment screenshot"
              height="h-40"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload a screenshot of your bank transfer or transaction receipt.
            Click to view larger.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note to Seller (Optional)
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Specific instructions..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !address || !paymentProof}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting..." : "Confirm & Send to Seller"}
        </button>
      </div>

      <ImageModal
        isOpen={!!viewImage}
        onClose={() => setViewImage(null)}
        imageUrl={viewImage || ""}
        altText="Payment Proof"
      />
    </div>
  );
};

export default Step1Payment;
