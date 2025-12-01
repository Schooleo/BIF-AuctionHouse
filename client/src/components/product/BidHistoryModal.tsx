import { useState, useEffect } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import { bidderApi } from "@services/bidder.api";
import Spinner from "@components/ui/Spinner";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import { useAuthStore } from "@stores/useAuthStore";
import { formatPrice } from "@utils/product";
import { formatBidTime } from "@utils/time";
import type { BidHistoryItem } from "@interfaces/product";

interface BidHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

const BidHistoryModal: React.FC<BidHistoryModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
}) => {
  const [bidHistory, setBidHistory] = useState<BidHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBids, setTotalBids] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 10;

  useEffect(() => {
    if (isOpen) {
      fetchBidHistory(currentPage);
    }
  }, [isOpen, currentPage]);

  const fetchBidHistory = async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bidderApi.getBidHistory(
        productId,
        useAuthStore.getState().token || "",
        page,
        limit
      );

      setBidHistory(response.bidHistory);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      setTotalBids(response.pagination.totalBids);
    } catch (error: any) {
      setError(error.message! || "Failed to fetch bid history.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      title={`Bid History for ${productName}`}
      size="lg"
      hideSubmitButton={true}
      cancelText="Close"
    >
      {/* Header */}
      <div className="mb-4 text-sm text-gray-600">
        Total Bids: <span className="font-semibold">{totalBids}</span>
      </div>

      {isLoading && <Spinner />}

      {error && <ErrorMessage text={error} />}

      {!isLoading && bidHistory.length === 0 && (
        <EmptyMessage text="No bids yet. Be the first to bid!" />
      )}

      {/* Table */}
      {!isLoading && bidHistory.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Bidder
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Bid Amount
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {bidHistory.map((bid, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-600">
                    {(currentPage - 1) * limit + index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {bid.bidder}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {formatPrice(bid.price)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {formatBidTime(bid.time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || isLoading}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </PopUpWindow>
  );
};

export default BidHistoryModal;
