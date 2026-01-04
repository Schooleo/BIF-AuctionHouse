import { useEffect, useState } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import { productApi } from "@services/product.api";
import { maskName } from "@utils/product";
import { User, ThumbsUp, ThumbsDown } from "lucide-react";
import Spinner from "@components/ui/Spinner";
import ErrorMessage from "@components/message/ErrorMessage";
import { formatPostedTime } from "@utils/product";

interface UserRatingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

type FilterType = "all" | "positive" | "negative";

interface Rating {
  _id: string;
  rater: {
    _id: string;
    name: string;
  };
  score: 1 | -1;
  comment: string;
  createdAt: string;
}

interface UserInfo {
  _id: string;
  name: string;
  positiveRatings: number;
  negativeRatings: number;
  reputationScore: number;
}

const UserRatingDetailsModal: React.FC<UserRatingDetailsModalProps> = ({ isOpen, onClose, userId, userName }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const limit = 5;

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);

        const scoreParam = filter === "positive" ? 1 : filter === "negative" ? -1 : undefined;

        const response = await productApi.getUserRatings({
          userId,
          page: currentPage,
          limit,
          score: scoreParam as 1 | -1 | undefined,
        });

        setUserInfo(response.user);
        setRatings(response.ratings);
        setTotalPages(response.pagination.totalPages);
      } catch (err: any) {
        console.error("Failed to fetch user ratings:", err);
        setError(err.message || "Failed to load user ratings");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [isOpen, userId, currentPage, filter]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getReputationPercentage = () => {
    if (!userInfo) return 0;
    return Math.round(userInfo.reputationScore * 100);
  };

  return (
    <PopUpWindow isOpen={isOpen} onClose={onClose} title="User Rating Details" size="2xl" hideFooter noPadding>
      <div className="flex flex-col h-[600px]">
        {/* User Info Section */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          {loading && !userInfo ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : error ? (
            <ErrorMessage text={error} />
          ) : userInfo ? (
            <div className="flex items-center gap-4">
              {/* User Icon */}
              <div className="bg-primary-blue text-white rounded-full p-4">
                <User size={40} strokeWidth={2} />
              </div>

              {/* User Details */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800">{userName || userInfo.name}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Rating Score:</span>{" "}
                    <span className="text-primary-blue font-semibold">{getReputationPercentage()}%</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <ThumbsUp size={14} />
                      <span className="font-medium">{userInfo.positiveRatings}</span>
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <ThumbsDown size={14} />
                      <span className="font-medium">{userInfo.negativeRatings}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200 px-6 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                filter === "all"
                  ? "bg-white text-primary-blue border-t-2 border-x border-primary-blue"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange("positive")}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                filter === "positive"
                  ? "bg-white text-green-600 border-t-2 border-x border-green-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Positive
            </button>
            <button
              onClick={() => handleFilterChange("negative")}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                filter === "negative"
                  ? "bg-white text-red-600 border-t-2 border-x border-red-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Negative
            </button>
          </div>
        </div>

        {/* Ratings List Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <ErrorMessage text={error} />
          ) : ratings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No ratings found</div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-800">{rating.rater.name}</span>
                        {rating.score === 1 ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            <ThumbsUp size={12} />
                            Positive
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                            <ThumbsDown size={12} />
                            Negative
                          </span>
                        )}
                      </div>
                      {rating.comment && <p className="text-gray-600 text-sm mb-2">{rating.comment}</p>}
                      <p className="text-xs text-gray-400">{formatPostedTime(rating.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </PopUpWindow>
  );
};

export default UserRatingDetailsModal;
