import React from "react";
import { Link } from "react-router-dom";
import type { Product } from "@interfaces/product";
import { formatPrice, maskName } from "@utils/product";
import { getTimeRemaining } from "@utils/time";
import { Clock, User, Gavel, Star, DollarSign, Package } from "lucide-react";

interface AdminActiveProductCardProps {
  product: Product;
}

const AdminActiveProductCard: React.FC<AdminActiveProductCardProps> = ({
  product,
}) => {
  const {
    _id,
    name,
    mainImage,
    currentPrice,
    buyNowPrice,
    bidCount,
    seller,
    currentBidder,
    startTime,
    endTime,
  } = product;

  const timeRemaining = getTimeRemaining(product.endTime);
  const isEnded = new Date(product.endTime) <= new Date();
  const bidder = currentBidder;

  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || "Unknown";

  const sellerName =
    typeof product.seller === "object" ? product.seller.name : "Unknown";

  const getTimeColor = () => {
    if (timeRemaining.isEnded) return "text-gray-500";
    if (timeRemaining.isUrgent) return "text-red-600 font-bold";
    return "text-green-600";
  };

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

  return (
    <Link
      to={`/admin/products/${product._id}`}
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          Active
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

        {/* Pricing Section */}
        <div className="space-y-2 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">
              Current Price:
            </span>
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(currentPrice)}
            </span>
          </div>
          {buyNowPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Buy Now:
              </span>
              <span className="text-sm font-semibold text-green-600">
                {formatPrice(buyNowPrice)}
              </span>
            </div>
          )}
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

        {/* Highest Bidder Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Highest Bidder
            </span>
          </div>
          {bidder ? (
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
          ) : (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
              <span className="text-sm text-gray-500 italic">
                No bids yet
              </span>
            </div>
          )}
        </div>

        {/* Time and Bids Section */}
        <div className="pt-3 border-t border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 font-medium">Time Left:</span>
            </div>
            <span className={`text-sm font-semibold ${getTimeColor()}`}>
              {timeRemaining.text}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <Gavel className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 font-medium">Total Bids:</span>
            </div>
            <span className="text-sm font-bold text-gray-800">
              {bidCount || 0}
            </span>
          </div>
        </div>

        {/* End Time */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Starts: {formatDate(startTime)}
          </p>
          <p className="text-xs text-gray-500 text-center">
            Ends: {formatDate(endTime)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default AdminActiveProductCard;