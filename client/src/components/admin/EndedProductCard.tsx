import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@interfaces/product";
import { formatPrice } from "@utils/product";
import {
  Clock,
  User,
  Gavel,
  Star,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  CreditCard,
  ShoppingBag,
  FileCheck,
} from "lucide-react";
import { orderApi } from "@services/order.api";

interface AdminEndedProductCardProps {
  product: Product;
}

const AdminEndedProductCard: React.FC<AdminEndedProductCardProps> = ({
  product,
}) => {
  const {
    _id,
    name,
    mainImage,
    currentPrice,
    bidCount,
    seller,
    currentBidder,
    highestBidder,
    endTime,
    winnerConfirmed,
    transactionCompleted,
  } = product;

  const bidder = currentBidder || highestBidder;
  const [orderStep, setOrderStep] = useState<number | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Fetch order step if transaction is in progress
  useEffect(() => {
    const fetchOrderStep = async () => {
      if (winnerConfirmed && !transactionCompleted && bidCount > 0) {
        try {
          setLoadingOrder(true);
          const order = await orderApi.getOrderByProduct(_id);
          if (order) {
            setOrderStep(order.step);
          }
        } catch (error) {
          console.error("Failed to fetch order:", error);
        } finally {
          setLoadingOrder(false);
        }
      }
    };

    fetchOrderStep();
  }, [_id, winnerConfirmed, transactionCompleted, bidCount]);

  // Determine product status
  const getProductStatus = () => {
    if (bidCount === 0) {
      return {
        label: "No Bids Placed",
        color: "bg-gray-100 text-gray-700 border-gray-300",
        icon: <XCircle className="w-4 h-4" />,
      };
    }

    if (transactionCompleted) {
      return {
        label: "Transaction Completed",
        color: "bg-green-100 text-green-700 border-green-300",
        icon: <CheckCircle className="w-4 h-4" />,
      };
    }

    if (winnerConfirmed) {
      // Show transaction step
      //const stepInfo = getTransactionStepInfo(orderStep);
      return {
        label: "In Transaction",
        color: "bg-blue-100 text-blue-700 border-blue-300",
        icon: <ShoppingBag className="w-4 h-4" />,
        //details: stepInfo.label,
        //details: "The Product is in Transaction Phase"
        //stepIcon: stepInfo.icon,
      };
    }

    return {
      label: "Awaiting Confirmation",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      icon: <AlertCircle className="w-4 h-4" />,
    };
  };

  const getTransactionStepInfo = (step: number | null) => {
    if (loadingOrder) {
      return { label: "Loading...", icon: null };
    }

    switch (step) {
      case 1:
        return {
          label: "Step 1: Payment",
          icon: <CreditCard className="w-4 h-4 text-blue-600" />,
        };
      case 2:
        return {
          label: "Step 2: Shipping",
          icon: <Truck className="w-4 h-4 text-blue-600" />,
        };
      case 3:
        return {
          label: "Step 3: Receipt Confirmation",
          icon: <Package className="w-4 h-4 text-blue-600" />,
        };
      case 4:
        return {
          label: "Step 4: Rating",
          icon: <Star className="w-4 h-4 text-blue-600" />,
        };
      default:
        return {
          label: "Payment & Delivery in Progress",
          icon: <ShoppingBag className="w-4 h-4 text-blue-600" />,
        };
    }
  };

  const status = getProductStatus();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Scroll to top immediately on click
    window.scrollTo(0, 0);
  };

  return (
    <Link
      to={`/admin/products/${_id}`}
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          Ended
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <h3
          className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem]"
          title={name}
        >
          {name}
        </h3>

        {/* Status Badge */}
        <div
          className={`${status.color} border rounded-lg px-3 py-2 flex items-center justify-center gap-2`}
        >
          <div className="flex flex-col items-center">
            {status.icon}
            <span className="text-sm font-bold">{status.label}</span>
            {status.details && (
              <div className="flex items-center gap-1.5 mt-1">
                {status.stepIcon}
                <span className="text-xs font-medium">{status.details}</span>
              </div>
            )}
          </div>
        </div>

        {/* Final Price */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-600 font-medium">Final Price:</span>
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(currentPrice)}
          </span>
        </div>

        {/* Seller Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Seller
            </span>
          </div>
          <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-sm font-medium text-gray-800 truncate">
                {typeof seller === "object" ? seller.name : "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 shrink-0">
              <Star className="w-3.5 h-3.5 fill-yellow-500" />
              <span className="text-xs font-semibold text-gray-700">
                {typeof seller === "object"
                  ? seller.rating?.toFixed(1) || "N/A"
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Winner Info */}
        {bidder && bidCount > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 uppercase">
                {winnerConfirmed ? "Winner" : "Highest Bidder"}
              </span>
            </div>
            {winnerConfirmed ? (
                <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium text-gray-800 truncate">
                        {typeof bidder === "object" ? bidder.name : "Unknown"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" />
                        <span className="text-xs font-semibold text-gray-700">
                        {typeof bidder === "object"
                            ? bidder.rating?.toFixed(1) || "N/A"
                            : "N/A"}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-sm font-medium text-gray-800 truncate">
                        {typeof bidder === "object" ? bidder.name : "Unknown"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" />
                        <span className="text-xs font-semibold text-gray-700">
                        {typeof bidder === "object"
                            ? bidder.rating?.toFixed(1) || "N/A"
                            : "N/A"}
                        </span>
                    </div>
                </div>
            )}
            
          </div>
        ) : (
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600 uppercase">
                    {"Highest Bidder"}
                </span>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                    <span className="text-sm text-gray-500 italic">No bids placed</span>
                </div>
            </div>
        )}

        {/* Bids and End Time */}
        <div className="pt-3 border-t border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <Gavel className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 font-medium">Total Bids:</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{bidCount || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 font-medium">Ended:</span>
            </div>
            <span className="text-sm text-gray-600">{formatDate(endTime)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AdminEndedProductCard;