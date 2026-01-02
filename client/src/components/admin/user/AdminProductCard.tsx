import React from "react";
import {
  Clock,
  Gavel,
  Trophy,
  TrendingDown,
  TrendingUp,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { UserProduct } from "../../../services/admin.api";

interface AdminProductCardProps {
  product: UserProduct;
  viewMode: "seller" | "bidder";
}

// Status display config
const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  scheduled: {
    label: "Scheduled",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: <Clock size={10} />,
  },
  ongoing: {
    label: "Ongoing",
    color: "text-primary-blue",
    bgColor: "bg-blue-100",
    icon: <Gavel size={10} />,
  },
  ended: {
    label: "Ended",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: <Package size={10} />,
  },
  sold: {
    label: "Sold",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: <Trophy size={10} />,
  },
  won: {
    label: "Won",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: <Trophy size={10} />,
  },
  lost: {
    label: "Lost",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: <TrendingDown size={10} />,
  },
  leading: {
    label: "Leading",
    color: "text-primary-blue",
    bgColor: "bg-blue-100",
    icon: <TrendingUp size={10} />,
  },
  outbid: {
    label: "Outbid",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    icon: <TrendingDown size={10} />,
  },
};

const AdminProductCard: React.FC<AdminProductCardProps> = ({
  product,
  viewMode,
}) => {
  const navigate = useNavigate();
  const status = statusConfig[product.status] || statusConfig.ongoing;

  const handleClick = () => {
    navigate(`/admin/products/${product._id}`);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US").format(price);
  };

  // Format date - simpler display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      if (days > 0) return `${days}d`;
      return `${hours}h`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer bg-white overflow-hidden"
    >
      {/* Image - taller with better aspect ratio */}
      <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
        <img
          src={product.mainImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Status Badge - smaller and cleaner */}
        <div
          className={`absolute top-2 right-2 ${status.bgColor} ${status.color} text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-semibold`}
        >
          {status.icon}
          {status.label}
        </div>
      </div>

      {/* Content - cleaner layout */}
      <div className="p-3">
        {/* Title */}
        <h4 className="font-semibold text-gray-800 line-clamp-1 text-sm group-hover:text-primary-blue transition-colors mb-2">
          {product.name}
        </h4>

        {/* Price */}
        <div className="text-primary-blue font-bold text-base mb-1">
          ${formatPrice(product.currentPrice)}
        </div>

        {/* Meta info row - compact */}
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDate(product.endTime)}
          </span>

          {/* Bid count */}
          {viewMode === "seller" && product.bidCount !== undefined && (
            <span className="flex items-center gap-1">
              <Gavel size={10} />
              {product.bidCount}
            </span>
          )}

          {viewMode === "bidder" && product.myBidCount && (
            <span className="flex items-center gap-1">
              <Gavel size={10} />
              {product.myBidCount}
            </span>
          )}
        </div>

        {/* Bidder highest bid - only show if exists */}
        {viewMode === "bidder" && product.myHighestBid && (
          <div className="text-[11px] text-gray-400 mt-1">
            Your bid: ${formatPrice(product.myHighestBid)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductCard;
