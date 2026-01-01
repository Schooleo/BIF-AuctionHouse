import { useCallback, useEffect, useState } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import Spinner from "@components/ui/Spinner";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import { formatPrice, maskName } from "@utils/product";
import { formatBidTime } from "@utils/time";

interface AdminBidHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidHistory: BidHistoryEntry[];
  currentBidderId?: string;
  winnerConfirmed?: boolean;
}

interface BidHistoryEntry {
  _id: string;
  bidder: {
    _id: string;
    name: string;
    rating?: number;
  };
  price: number;
  createdAt: string;
}

const PAGE_SIZE = 10;

const AdminBidHistoryModal: React.FC<AdminBidHistoryModalProps> = ({
  isOpen,
  onClose,
  bidHistory,
  currentBidderId,
  winnerConfirmed = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading] = useState(false);

  const totalPages = Math.ceil(bidHistory.length / PAGE_SIZE);

  const visibleRows = bidHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen]);

  const handlePageChange = (direction: "next" | "prev") => {
    const targetPage = direction === "next" ? currentPage + 1 : currentPage - 1;
    if (targetPage < 1 || targetPage > totalPages) return;
    setCurrentPage(targetPage);
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Bid History"
      size="lg"
      hideSubmitButton={true}
      cancelText="Close"
    >
      {loading && (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      )}

      {!loading && bidHistory.length === 0 && (
        <EmptyMessage text="No bids placed for this product yet." />
      )}

      {!loading && bidHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
            <div>Total bids: {bidHistory.length}</div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Bidder</th>
                  <th className="px-4 py-3 text-center">Bid Amount</th>
                  <th className="px-4 py-3 text-center">Placed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visibleRows.map((row, idx) => {
                  const globalIndex = (currentPage - 1) * PAGE_SIZE + idx + 1;
                  const isCurrentWinner = row.bidder._id === currentBidderId;

                  return (
                    <tr
                      key={row._id}
                      className={
                        isCurrentWinner
                          ? "bg-emerald-50"
                          : "bg-white"
                      }
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {globalIndex}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">
                            {maskName(row.bidder.name)}
                          </span>
                          {row.bidder.rating !== undefined && (
                            <span className="text-xs text-gray-500">
                              Rating: {row.bidder.rating.toFixed(2)} ★
                            </span>
                          )}
                          {isCurrentWinner && (
                            <span
                              className={`text-xs font-medium ${
                                winnerConfirmed
                                  ? "text-emerald-600"
                                  : "text-indigo-700"
                              }`}
                            >
                              {winnerConfirmed
                                ? "Confirmed winner"
                                : "Highest bidder"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {formatPrice(row.price)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatBidTime(row.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => handlePageChange("prev")}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange("next")}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </PopUpWindow>
  );
};

export default AdminBidHistoryModal;