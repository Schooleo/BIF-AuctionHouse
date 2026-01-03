import React, { useState } from "react";
import { type IOrder } from "@interfaces/admin";
import { formatPrice } from "@utils/product";
import { MapPin, Clock } from "lucide-react";
import ImageModal from "@components/ui/ImageModal";
import { Link } from "react-router-dom";

interface OrderProduct {
  [key: string]: unknown;
  _id: string;
  name: string;
  mainImage: string;
  currentPrice?: number | undefined;
}

interface OrderMainDetailsProps {
  order: IOrder;
}

const OrderMainDetails: React.FC<OrderMainDetailsProps> = ({ order }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const product: string | OrderProduct = order.product;

  const productName =
    typeof product === "string" ? product : product?.name || "Unknown Product";
  const productPx =
    typeof product === "string" ? product : product?.currentPrice || 0;
  const productImg = typeof product === "string" ? product : product?.mainImage;
  const productId = typeof product === "string" ? product : product?._id;

  const openImage = (url?: string) => {
    if (url) setSelectedImage(url);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Order Details
          </h3>

          {/* Product Header */}
          <div className="flex gap-4 mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden shrink-0">
              {productImg && (
                <Link to={`/admin/products/${productId}`}>
                  <img
                    src={productImg}
                    alt={productName}
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  />
                </Link>
              )}
            </div>
            <div className="flex flex-col justify-between">
              <Link
                to={`/admin/products/${productId}`}
                className="font-medium text-gray-900 text-lg hover:text-primary-blue hover:underline"
              >
                {productName}
              </Link>
              <p className="text-gray-500 text-sm">ID: {order._id}</p>
              <div className="mt-2 text-primary-blue font-bold text-xl">
                {formatPrice(Number(productPx))}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="flex items-center gap-3">
              <Clock className="text-gray-400" size={25} />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Current Status
                </p>
                <p className="text-gray-600">
                  {order.status.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center gap-3">
              <MapPin className="text-gray-400" size={25} />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Delivery Address
                </p>
                <p className="text-gray-600">
                  {order.shippingAddress || "Not provided yet"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Proofs Section */}
        <div className="p-6 bg-gray-50">
          <h4 className="font-medium text-gray-800 mb-4">Proofs & Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Side */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Buyer (Payment)
              </h5>
              <div>
                <p className="text-xs text-gray-500 mb-1">Proof Image:</p>
                {order.paymentProof ? (
                  <div
                    onClick={() => openImage(order.paymentProof)}
                    className="block w-full h-32 bg-gray-200 rounded overflow-hidden hover:opacity-90 cursor-pointer"
                  >
                    <img
                      src={order.paymentProof}
                      alt="Payment Proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No proof uploaded
                  </p>
                )}
              </div>
              {order.buyerNote && (
                <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-600">
                  <span className="font-medium text-xs text-gray-500 block mb-1">
                    Note:
                  </span>
                  {order.buyerNote}
                </div>
              )}
            </div>

            {/* Seller Side */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Seller (Shipping)
              </h5>
              <div>
                <p className="text-xs text-gray-500 mb-1">Proof Image:</p>
                {order.shippingProof ? (
                  <div
                    onClick={() => openImage(order.shippingProof)}
                    className="block w-full h-32 bg-gray-200 rounded overflow-hidden hover:opacity-90 cursor-pointer"
                  >
                    <img
                      src={order.shippingProof}
                      alt="Shipping Proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No proof uploaded
                  </p>
                )}
              </div>
              {order.sellerNote && (
                <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-600">
                  <span className="font-medium text-xs text-gray-500 block mb-1">
                    Note:
                  </span>
                  {order.sellerNote}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={closeImage}
        imageUrl={selectedImage || ""}
        altText="Proof Image"
      />
    </>
  );
};

export default OrderMainDetails;
