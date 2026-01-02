import React from "react";
import { useNavigate } from "react-router-dom";
import { type IOrder } from "../../services/admin.api";
import { X, Trash2, Box } from "lucide-react";
import { formatPrice } from "../../utils/product";

interface OrderCardProps {
  order: IOrder;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel, onDelete }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "SHIPPED":
        return "bg-blue-100 text-blue-800";
      case "RECEIVED":
        return "bg-purple-100 text-purple-800";
      case "PAID_CONFIRMED":
        return "bg-cyan-100 text-cyan-800";
      case "PENDING_PAYMENT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabel =
    order.status === "PAID_CONFIRMED"
      ? "Paid"
      : order.status.replace(/_/g, " ");

  const sellerName =
    typeof order.seller === "string"
      ? order.sellerInfo?.name || "Deleted User"
      : order.seller?.name || "Deleted User";

  const buyerName =
    typeof order.buyer === "string"
      ? order.buyerInfo?.name || "Deleted User"
      : order.buyer?.name || "Deleted User";

  const productObj =
    typeof order.product === "string" ? order.productInfo : order.product;
  const productName = productObj?.name || "Unknown Product";
  const productImage = productObj?.mainImage;
  const productPrice = productObj?.currentPrice || 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate unless specific elements clicked
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) {
      return;
    }
    navigate(`/admin/orders/${order._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow flex gap-4 cursor-pointer relative group"
    >
      {/* Product Image */}
      <div className="w-24 h-24 bg-gray-50 rounded-md shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
        {productImage ? (
          <img
            src={productImage}
            alt={productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <Box className="text-gray-300" size={32} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex flex-col gap-2">
          {/* Row 1: Order ID & Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3
                className="font-semibold text-gray-800 truncate"
                title={productName}
              >
                #{order._id.slice(-6).toUpperCase()}
              </h3>
              <div className="h-px w-2 bg-gray-400 rounded-full"></div>
              <p className="text-xs text-gray-500 truncate" title={productName}>
                {productName}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${getStatusColor(
                order.status
              )}`}
            >
              {statusLabel}
            </span>
          </div>

          {/* Row 2: Seller & Bidder */}
          <div className="text-xs text-gray-600 truncate">
            <span className="font-medium text-gray-800">Seller:</span>{" "}
            {sellerName}
            <span className="mx-2 text-gray-300">|</span>
            <span className="font-medium text-gray-800">Bidder:</span>{" "}
            {buyerName}
          </div>
        </div>

        {/* Row 3: Bottom Actions */}
        <div className="flex items-center justify-between mt-1 border-t border-gray-100 pt-1.5">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-primary-blue">
              {formatPrice(productPrice)}
            </span>
            <span className="text-[11px] text-gray-400">
              Started: {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {order.status !== "CANCELLED" && order.status !== "COMPLETED" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card navigation
                  onCancel(order._id);
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors z-10"
                title="Cancel Order"
              >
                <span className="text-xs font-bold">Cancel Order</span>
                <Trash2 size={16} />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(order._id);
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors z-10"
                title="Delete Order"
              >
                <span className="text-xs font-bold">Delete Order</span>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
