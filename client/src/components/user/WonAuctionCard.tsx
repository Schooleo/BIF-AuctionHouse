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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group/card">
      <div className="flex gap-4 p-4">
        {/* IMAGE */}
        <Link
          to={`/products/${auction._id}`}
          className="shrink-0 relative overflow-hidden rounded-lg w-28 h-28 bg-gray-100"
        >
          <img
            src={auction.mainImage || "/placeholder.jpg"}
            alt={auction.name}
            className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
          />
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors duration-300" />
        </Link>

        {/* INFO */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="space-y-2">
            <Link to={`/products/${auction._id}`}>
              <h3 className="font-semibold text-base text-gray-900 group-hover/card:text-primary-blue line-clamp-2 transition-colors">
                {auction.name}
              </h3>
            </Link>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-lg">
                <Trophy className="w-4 h-4" strokeWidth={2.5} />
                <span>{auction.currentPrice.toLocaleString()}₫</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Ended{" "}
                  {new Date(auction.endTime).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="text-gray-400">Seller:</span>
                <span className="font-medium text-gray-700 truncate hover:text-primary-blue transition-colors">
                  {auction.seller?.name || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION AREA - Fills remaining space */}
      <div className="flex-1 bg-gray-50 border-t border-gray-100 p-3.5 flex flex-col justify-center">
        {!auction.hasRated ? (
          <div className="space-y-3 w-full">
            <div className="flex flex-col max-w-md mx-auto gap-2 p-2 items-center text-sm text-gray-500 text-center italic border-l-2 border-r-2 border-gray-200 rounded-md">
              <p className="font-medium">You haven't rated this seller yet.</p>
              <p>Consider sharing your experience!</p>
            </div>
            <button
              onClick={onRate}
              className="w-md mx-auto py-3 bg-primary-blue text-white rounded-lg hover:-translate-y-1 hover:shadow-md transition-all text-sm font-semibold flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              Rate Seller
            </button>
          </div>
        ) : (
          <div className="space-y-3 w-full">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Your Review
                </span>
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    auction.myRating?.score === 1
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
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
                <div className="relative pl-3 border-l-2 border-gray-200 bg-white/50 p-2 rounded-r-md">
                  <p className="text-sm text-gray-600 italic line-clamp-2">
                    "{auction.myRating.comment}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onUpdateRating}
                className="flex-1 py-2 text-xs border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 hover:text-primary-blue hover:border-primary-blue/30 transition-all font-semibold shadow-sm"
              >
                Edit Review
              </button>
              <button
                onClick={onDeleteRating}
                className="flex-1 py-2 text-xs border border-gray-200 bg-white text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-semibold shadow-sm"
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
