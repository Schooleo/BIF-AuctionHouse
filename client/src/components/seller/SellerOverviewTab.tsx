import React from "react";
import { Link } from "react-router-dom";
import {
  Database,
  Trophy,
  ThumbsDown,
  StarIcon,
  Gavel,
  Award,
  Crown,
  User,
} from "lucide-react";
import type { SellerStats } from "@interfaces/seller";

interface SellerOverviewTabProps {
  stats: SellerStats | null;
}

const SellerOverviewTab: React.FC<SellerOverviewTabProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold mb-6">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Database size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Products</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.totalProducts}
            </p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Successful Auctions
            </p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.successfulAuctions}
            </p>
          </div>
        </div>

        {/* Stat Card 3: Ratings */}
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
            <StarIcon size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rating Overview</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-800">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">/ 5.0</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 space-x-2">
              <span className="text-green-600 font-medium">
                +{stats.positiveRatings} pos
              </span>
              <span className="text-red-600 font-medium">
                -{stats.negativeRatings} neg
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Most Successful Product */}
        {stats.mostSuccessfulProduct && (
          <div className="flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} />
              Most Successful Product
            </h3>
            <div className="bg-white rounded-xl flex shadow-md flex-1 overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
              {stats.mostSuccessfulProduct.mainImage && (
                <div className="w-1/3 relative shrink-0 bg-gray-100">
                  <img
                    src={stats.mostSuccessfulProduct.mainImage}
                    alt={stats.mostSuccessfulProduct.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex-1 min-w-0 flex flex-col">
                <Link
                  to={`/seller/products/${stats.mostSuccessfulProduct._id}`}
                  className="font-bold text-gray-900 line-clamp-1 text-lg mb-1 hover:text-primary-blue transition-colors"
                  title={stats.mostSuccessfulProduct.name}
                >
                  {stats.mostSuccessfulProduct.name}
                </Link>
                <div className="text-primary-blue font-extrabold text-xl mb-4">
                  {stats.mostSuccessfulProduct.currentPrice.toLocaleString()} ₫
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto gap-2">
                  <div
                    className="flex items-center gap-1.5 text-gray-600"
                    title="Total Bids"
                  >
                    <Gavel size={16} className="text-gray-400" />
                    <span className="text-sm font-medium">
                      {stats.mostSuccessfulProduct.bidCount} Bids
                    </span>
                  </div>
                  {stats.mostSuccessfulProduct.currentBidder && (
                    <div
                      className="flex items-center gap-1.5 text-gray-600 min-w-0"
                      title={`Winner: ${stats.mostSuccessfulProduct.currentBidder.name}`}
                    >
                      <Crown size={16} className="text-yellow-500 shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {stats.mostSuccessfulProduct.currentBidder.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Least Successful Product */}
        {stats.leastSuccessfulProduct && (
          <div className="flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ThumbsDown className="text-red-600" size={20} />
              Least Successful Product
            </h3>
            <div className="bg-white rounded-xl flex shadow-md flex-1 overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
              {stats.leastSuccessfulProduct.mainImage && (
                <div className="w-1/3 relative shrink-0 bg-gray-100">
                  <img
                    src={stats.leastSuccessfulProduct.mainImage}
                    alt={stats.leastSuccessfulProduct.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex-1 min-w-0 flex flex-col">
                <Link
                  to={`/seller/products/${stats.leastSuccessfulProduct._id}`}
                  className="font-bold text-gray-900 line-clamp-1 text-lg mb-1 hover:text-primary-blue transition-colors"
                  title={stats.leastSuccessfulProduct.name}
                >
                  {stats.leastSuccessfulProduct.name}
                </Link>
                <div className="text-primary-blue font-extrabold text-xl mb-4">
                  {stats.leastSuccessfulProduct.currentPrice.toLocaleString()} ₫
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto gap-2">
                  <div
                    className="flex items-center gap-1.5 text-gray-600"
                    title="Total Bids"
                  >
                    <Gavel size={16} className="text-gray-400" />
                    <span className="text-sm font-medium">
                      {stats.leastSuccessfulProduct.bidCount} Bids
                    </span>
                  </div>
                  {stats.leastSuccessfulProduct.currentBidder && (
                    <div
                      className="flex items-center gap-1.5 text-gray-600 min-w-0"
                      title={`Winner: ${stats.leastSuccessfulProduct.currentBidder.name}`}
                    >
                      <User size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {stats.leastSuccessfulProduct.currentBidder.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOverviewTab;
