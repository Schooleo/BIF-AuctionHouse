import type { AuctionItem } from "@interfaces/bidder";
import { Link } from "react-router-dom";
import { Trophy, Calendar, ThumbsUp, ThumbsDown } from "lucide-react";

interface WonAuctionCardProps {
  auction: AuctionItem;
  onRate: () => void;
  onUpdateRating: () => void;
  onDeleteRating: () => void;
}

const WonAuctionCard: React.FC<WonAuctionCardProps> = ({
  auction,
  onRate,
  onUpdateRating,
  onDeleteRating,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
      <div className="flex gap-3 p-3">
        {/* IMAGE */}
        <Link to={`/products/${auction._id}`} className="shrink-0">
          <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100">
            <img
              src={auction.mainImage || "/placeholder.jpg"}
              alt={auction.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        </Link>

        {/* INFO */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-1">
            <Link to={`/products/${auction._id}`}>
              <h3 className="font-semibold text-sm text-gray-900 hover:text-blue-600 line-clamp-1 transition-colors">
                {auction.name}
              </h3>
            </Link>

            <div className="flex items-center gap-1 text-green-600 font-bold text-base">
              <Trophy className="w-4 h-4" strokeWidth={2.5} />
              <span>{auction.currentPrice.toLocaleString()}₫</span>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>
                {new Date(auction.endTime).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500">Seller:</span>
              <span className="font-medium text-gray-700 truncate">
                {auction.seller?.name || "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RATING SECTION */}
      <div className="px-3 pb-3">
        {!auction.hasRated ? (
          <button
            onClick={onRate}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Rate Seller
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Your rating:</span>
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    auction.myRating?.score === 1
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {auction.myRating?.score === 1 ? (
                    <>
                      <ThumbsUp className="w-3 h-3" strokeWidth={2.5} />
                      Positive
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="w-3 h-3" strokeWidth={2.5} />
                      Negative
                    </>
                  )}
                </span>
              </div>
              {auction.myRating?.comment && (
                <p className="text-xs text-gray-600 italic line-clamp-2">
                  "{auction.myRating.comment}"
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onUpdateRating}
                className="flex-1 px-2 py-1.5 text-xs border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium"
              >
                Edit
              </button>
              <button
                onClick={onDeleteRating}
                className="flex-1 px-2 py-1.5 text-xs border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WonAuctionCard;
