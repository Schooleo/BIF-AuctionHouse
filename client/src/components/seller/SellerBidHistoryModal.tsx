import { useCallback, useEffect, useMemo, useState } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import Spinner from "@components/ui/Spinner";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import { sellerApi } from "@services/seller.api";
import { useAuthStore } from "@stores/useAuthStore";
import { formatPrice } from "@utils/product";
import { formatBidTime } from "@utils/time";
import type { BidHistoryItem } from "@interfaces/product";
import { Loader2, ShieldX } from "lucide-react";

interface SellerBidHistoryModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onRejectBidder: (bidderId: string) => Promise<void>;
  rejectedBidderIds: string[];
  currentBidderId?: string | null;
  rejectingBidderId?: string | null;
}

interface BidHistoryRow {
  entryId: string;
  bidderId: string;
  bidderName: string;
  bidAmount: number;
  createdAt: string;
  bidderRating?: number;
}

const PAGE_SIZE = 10;

const SellerBidHistoryModal: React.FC<SellerBidHistoryModalProps> = ({
  productId,
  isOpen,
  onClose,
  onRejectBidder,
  rejectedBidderIds,
  currentBidderId,
  rejectingBidderId,
}) => {
  const token = useAuthStore((state) => state.token) || "";
  const [rows, setRows] = useState<BidHistoryRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBids, setTotalBids] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [pendingReject, setPendingReject] = useState<BidHistoryRow | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);

  const isRejected = useCallback(
    (bidderId: string) =>
      rejectedBidderIds.some((id) => id.toString() === bidderId),
    [rejectedBidderIds]
  );

  const mapBidHistory = useCallback(
    (
      items: {
        _id: string;
        bidder: { _id: string; name?: string; rating?: number } | null;
        price: number;
        createdAt: string;
      }[]
    ): BidHistoryRow[] => {
      return items.map((item) => ({
        entryId: item._id,
        bidderId: item.bidder?._id ?? "",
        bidderName: item.bidder?.name ?? "Unknown bidder",
        bidderRating: item.bidder?.rating,
        bidAmount: item.price,
        createdAt: item.createdAt,
      }));
    },
    []
  );

  const fetchBidHistory = useCallback(
    async (page: number) => {
      setLoading(true);
      setTableError(null);
      try {
        const response = await sellerApi.getProductBidHistory(productId, {
          page,
          limit: PAGE_SIZE,
        });
        setRows(mapBidHistory(response.bidHistory));
        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
        setTotalBids(response.pagination.totalBids);
      } catch (err: any) {
        const message =
          err?.message || "Failed to fetch bid history. Please try again.";
        setTableError(message);
      } finally {
        setLoading(false);
      }
    },
    [productId, mapBidHistory]
  );

  useEffect(() => {
    if (isOpen) {
      fetchBidHistory(1);
    } else {
      setRows([]);
      setPendingReject(null);
      setTableError(null);
      setPendingError(null);
    }
  }, [isOpen, fetchBidHistory]);

  const handlePageChange = async (direction: "next" | "prev") => {
    const targetPage =
      direction === "next" ? currentPage + 1 : currentPage - 1;

    if (targetPage < 1 || targetPage > totalPages) return;

    await fetchBidHistory(targetPage);
  };

  const currentRejecting = useMemo(() => {
    if (!pendingReject) return false;
    if (!rejectingBidderId) return actionLoading;
    return rejectingBidderId === pendingReject.bidderId;
  }, [pendingReject, rejectingBidderId, actionLoading]);

  const confirmReject = async () => {
    if (!pendingReject) return;

    setPendingError(null);
    setActionLoading(true);

    try {
      await onRejectBidder(pendingReject.bidderId);
      setPendingReject(null);
      await fetchBidHistory(1);
    } catch (err: any) {
      const message =
        err?.message || "Failed to reject bidder. Please try again.";
      setPendingError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
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

        {!loading && tableError && <ErrorMessage text={tableError} />}

        {!loading && !tableError && rows.length === 0 && (
          <EmptyMessage text="No bids placed for this product yet." />
        )}

        {!loading && !tableError && rows.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Total bids: <span className="font-semibold">{totalBids}</span>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Bidder</th>
                    <th className="px-4 py-3 text-right">Bid Amount</th>
                    <th className="px-4 py-3 text-left">Placed At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.map((row, idx) => {
                    const globalIndex = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    const bidderRejected = isRejected(row.bidderId);
                    const isCurrentWinner = row.bidderId === currentBidderId;

                    return (
                      <tr
                        key={row.entryId}
                        className={
                          isCurrentWinner
                            ? "bg-emerald-50"
                            : bidderRejected
                            ? "bg-red-50"
                            : "bg-white"
                        }
                      >
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {globalIndex}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">
                              {row.bidderName}
                            </span>
                            {row.bidderRating !== undefined && (
                              <span className="text-xs text-gray-500">
                                Rating: {row.bidderRating.toFixed(2)} ★
                              </span>
                            )}
                            {isCurrentWinner && (
                              <span className="text-xs text-emerald-700 font-medium">
                                Current highest bidder
                              </span>
                            )}
                            {bidderRejected && (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
                                <ShieldX className="w-3 h-3" />
                                Rejected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatPrice(row.bidAmount)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatBidTime(row.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setPendingReject(row)}
                            disabled={
                              !row.bidderId ||
                              bidderRejected ||
                              rejectingBidderId === row.bidderId
                            }
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-500 text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rejectingBidderId === row.bidderId ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Rejecting...
                              </>
                            ) : (
                              "Reject Bidder"
                            )}
                          </button>
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

      <PopUpWindow
        isOpen={Boolean(pendingReject)}
        onClose={() => {
          if (!currentRejecting) {
            setPendingReject(null);
            setPendingError(null);
          }
        }}
        title="Reject Bidder"
        submitText="Reject Bidder"
        onSubmit={confirmReject}
        isLoading={currentRejecting}
      >
        {pendingReject && (
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              Are you sure you want to reject{" "}
              <span className="font-semibold">{pendingReject.bidderName}</span>{" "}
              from bidding on this product?
            </p>
            <p>
              Their bid amount of{" "}
              <span className="font-semibold text-red-600">
                {formatPrice(pendingReject.bidAmount)}
              </span>{" "}
              will be removed from the auction history.
            </p>
            {pendingReject.bidderId === currentBidderId && (
              <p className="text-yellow-600 font-medium">
                This bidder is currently the highest bidder. Rejecting them will
                recalculate the auction winner using the next highest bid or
                reset the price to the starting amount if no other bids exist.
              </p>
            )}
            {pendingError && <ErrorMessage text={pendingError} />}
          </div>
        )}
      </PopUpWindow>
    </>
  );
};

export default SellerBidHistoryModal;