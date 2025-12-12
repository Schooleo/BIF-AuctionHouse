import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@contexts/SocketContext";
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

interface NewBidData {
  currentBidder: string;
  currentPrice: number;
  time: string;
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

  const { socket } = useSocket();
  const limit = 10;

  const fetchBidHistory = useCallback(
    async (page: number, isBackground = false) => {
      if (!isBackground) setIsLoading(true);
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
      } catch (error: unknown) {
        if (!isBackground) {
          const err =
            error instanceof Error
              ? error
              : new Error("Failed to fetch bid history.");
          setError(err.message);
        }
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    if (isOpen) {
      fetchBidHistory(currentPage);
    }
  }, [isOpen, currentPage, productId, fetchBidHistory]);

  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleNewBid = (data: NewBidData) => {
      setTotalBids((prevTotal) => {
        const newTotal = prevTotal + 1;
        setTotalPages(Math.ceil(newTotal / limit));
        return newTotal;
      });

      // Nếu đang ở trang đầu, thêm lượt đấu giá mới lên đầu danh sách
      if (currentPage === 1) {
        setBidHistory((prev) => {
          const newItem: BidHistoryItem = {
            bidder: data.currentBidder,
            price: data.currentPrice,
            time: data.time || new Date().toISOString(),
          };
          const newList = [newItem, ...prev];
          return newList.slice(0, limit);
        });
      } else {
        // Đối với các trang khác, cần tải lại để đảm bảo dữ liệu hiển thị đúng
        fetchBidHistory(currentPage, true);
      }
    };

    socket.on("new_bid", handleNewBid);
    return () => {
      socket.off("new_bid", handleNewBid);
    };
  }, [socket, isOpen, currentPage, fetchBidHistory]);

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      title={`Bid history: ${productName}`}
      size="lg"
      hideSubmitButton={true}
      cancelText="Close"
    >
      {/* Header and Pagination */}
      <div className="mb-4 flex flex-wrap justify-between items-end gap-2 text-sm text-gray-600">
        <div>
          Total bids: <span className="font-semibold">{totalBids}</span>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
            >
              Previous
            </button>

            <span className="text-xs font-medium min-w-[60px] text-center">
              Page {currentPage} / {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Container cố định chiều cao - Điều chỉnh cho 10 hàng */}
      <div className="h-[586px] overflow-y-auto relative rounded-md border border-gray-200">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="h-full flex items-center justify-center text-red-500">
            <ErrorMessage text={error} />
          </div>
        )}

        {!isLoading && !error && bidHistory.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <EmptyMessage text="No bids found. Be the first bidder!" />
          </div>
        )}

        {/* Table */}
        {!error && bidHistory.length > 0 && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm text-sm">
              <tr className="border-b border-gray-300">
                <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-gray-100">
                  #
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-gray-100">
                  Bidder
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-gray-100">
                  Price
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-gray-100">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {bidHistory.map((bid, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors h-[54px]" // Fixed height per row
                >
                  <td className="px-4 py-3 text-center text-gray-600">
                    {(currentPage - 1) * limit + index + 1}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-800">
                    {bid.bidder}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-green-600">
                    {formatPrice(bid.price)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {formatBidTime(bid.time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PopUpWindow>
  );
};

export default BidHistoryModal;
