import type { AuctionItem } from "@interfaces/bidder";
import { Link } from "react-router-dom";
import {
  Trophy,
  Calendar,
  Star,
  ThumbsUp,
  ThumbsDown,
  Gavel,
} from "lucide-react";

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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 p-3 md:p-4">
        {/* ========== LEFT: IMAGE ========== */}
        <Link to={`/product/${auction._id}`} className="flex-shrink-0">
          <div className="w-full md:w-28 lg:w-32 h-40 md:h-28 lg:h-32 rounded-md overflow-hidden bg-gray-100">
            <img
              src={auction.mainImage || "/placeholder.jpg"}
              alt={auction.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

        {/* ========== CENTER: INFO ========== */}
        <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
          <Link to={`/product/${auction._id}`}>
            <h3 className="font-bold text-base md:text-lg text-gray-900 hover:text-blue-600 line-clamp-2 transition-colors">
              {auction.name}
            </h3>
          </Link>

          {/* Won Price - Highlighted */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-green-600 font-bold text-lg md:text-xl">
              <Trophy className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
              <span>{auction.currentPrice.toLocaleString()}₫</span>
            </div>
            <span className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">
              You won!
            </span>
          </div>

          {/* Won Date */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              Won on{" "}
              {new Date(auction.endTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-600">Seller:</span>
            <span className="font-semibold text-gray-800 truncate">
              {auction.seller?.name || "Unknown"}
            </span>
          </div>

          {/* Optional: Category & Bid count */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Gavel className="w-3.5 h-3.5" />
            <span>
              {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"}
            </span>
          </div>
        </div>

        {/* ========== RIGHT: RATING SECTION ========== */}
        <div className="flex-shrink-0 w-full lg:w-56 flex flex-col justify-between gap-2 md:gap-3">
          {!auction.hasRated ? (
            // NOT RATED YET
            <>
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">
                    Help the community!
                  </p>
                </div>
                <p className="text-xs text-blue-600">
                  Share your experience with this seller
                </p>
              </div>
              <button
                onClick={onRate}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm md:text-base"
              >
                Rate Seller
              </button>
            </>
          ) : (
            // ALREADY RATED
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-xs text-gray-600 font-medium">
                    Your rating:
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs md:text-sm font-bold ${
                      auction.myRating?.score === 1
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {auction.myRating?.score === 1 ? (
                      <>
                        <ThumbsUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                        <span>Positive</span>
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                        <span>Negative</span>
                      </>
                    )}
                  </span>
                </div>
                {auction.myRating?.comment && (
                  <p className="text-xs md:text-sm text-gray-700 italic line-clamp-2">
                    "{auction.myRating.comment}"
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onUpdateRating}
                  className="flex-1 px-3 py-2 text-xs md:text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 active:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={onDeleteRating}
                  className="flex-1 px-3 py-2 text-xs md:text-sm border border-red-600 text-red-600 rounded-md hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WonAuctionCard;
