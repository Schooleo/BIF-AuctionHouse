import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import type { BidItem } from "@interfaces/bidder";
import BiddingProductCard from "@components/product/BiddingProductCard";
import Spinner from "@components/ui/Spinner";

const validatePage = (pageStr: string | null): number => {
  const parsed = parseInt(pageStr || "1");
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

const validateSortBy = (
  sortByStr: string | null
): "endTime" | "price" | "bidCount" => {
  const valid = ["endTime", "price", "bidCount"];
  return valid.includes(sortByStr || "") ? (sortByStr as any) : "endTime";
};

const validateSortOrder = (orderStr: string | null): "asc" | "desc" => {
  return orderStr === "asc" ? "asc" : "desc";
};

const validateStatus = (
  statusStr: string | null
): "active" | "awaiting" | "processing" | "all" => {
  const valid = ["active", "awaiting", "processing", "all"];
  return valid.includes(statusStr || "") ? (statusStr as any) : "all";
};

const BiddingContainer: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [searchParams, setSearchParams] = useSearchParams();

  const pageFromUrl = validatePage(searchParams.get("page"));
  const sortByFromUrl = validateSortBy(searchParams.get("sortBy"));
  const sortOrderFromUrl = validateSortOrder(searchParams.get("sortOrder"));
  const statusFromUrl = validateStatus(searchParams.get("status"));

  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUrlChanging, setIsUrlChanging] = useState(false);
  const [page, setPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [awaitingTotal, setAwaitingTotal] = useState(0);
  const [activeTotal, setActiveTotal] = useState(0);
  const [processingTotal, setProcessingTotal] = useState(0);

  const [sortBy, setSortBy] = useState<"endTime" | "price" | "bidCount">(
    sortByFromUrl
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(sortOrderFromUrl);
  const [status, setStatus] = useState<
    "active" | "awaiting" | "processing" | "all"
  >(statusFromUrl);

  const limit = 12;

  useEffect(() => {
    const newPage = validatePage(searchParams.get("page"));
    const newSortBy = validateSortBy(searchParams.get("sortBy"));
    const newSortOrder = validateSortOrder(searchParams.get("sortOrder"));
    const newStatus = validateStatus(searchParams.get("status"));

    if (
      newPage !== page ||
      newSortBy !== sortBy ||
      newSortOrder !== sortOrder ||
      newStatus !== status
    ) {
      setIsUrlChanging(true);
      setPage(newPage);
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      setStatus(newStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    const params: Record<string, string> = {};

    if (page !== 1) params.page = page.toString();
    if (sortBy !== "endTime") params.sortBy = sortBy;
    if (sortOrder !== "desc") params.sortOrder = sortOrder;
    if (status !== "all") params.status = status;

    setSearchParams(params, { replace: true });
  }, [page, sortBy, sortOrder, status, setSearchParams]);

  useEffect(() => {
    // Nếu page vượt quá totalPages, redirect về page cuối
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  useEffect(() => {
    if (!token) return;
    fetchBids().finally(() => setIsUrlChanging(false));
  }, [page, sortBy, sortOrder, status, token]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bidderApi.getMyBids(
        page,
        limit,
        sortBy,
        sortOrder,
        status
      );

      setBids(response.bids || []);
      setTotalPages(response.pagination.totalPages);
      setAwaitingTotal(response.statistics.awaitingTotal || 0);
      setActiveTotal(response.statistics.activeTotal || 0);
      setProcessingTotal(response.statistics.processingTotal || 0);
    } catch (err: any) {
      setError(err.message || "Unable to load your bids");
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy: "endTime" | "price" | "bidCount") => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setPage(1); // Reset về page 1 khi sort
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" }); // ✅ Scroll to top
  };

  if (loading || isUrlChanging) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchBids}
          className="mt-4 text-blue-600 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">You haven't placed any bids yet</p>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          Start Bidding Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      {(awaitingTotal > 0 || activeTotal > 0 || processingTotal > 0) && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{activeTotal}</span> active{" "}
                <span className="font-semibold">{awaitingTotal}</span> awaiting{" "}
                <span className="font-semibold">{processingTotal}</span>{" "}
                processing
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {status === "all"
                  ? `Showing all bids (${activeTotal + awaitingTotal + processingTotal} total)`
                  : `Filtered by: ${status.charAt(0).toUpperCase() + status.slice(1)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== FILTER TABS ========== */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>

        <button
          onClick={() => {
            setStatus("all");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            status === "all"
              ? "bg-primary-blue text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Bids
          <span className="ml-2 bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
            {activeTotal + awaitingTotal + processingTotal}
          </span>
        </button>

        <button
          onClick={() => {
            setStatus("active");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            status === "active"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Active
          <span className="ml-2 bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
            {activeTotal}
          </span>
        </button>

        <button
          onClick={() => {
            setStatus("awaiting");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            status === "awaiting"
              ? "bg-yellow-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Awaiting
          <span className="ml-2 bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
            {awaitingTotal}
          </span>
        </button>

        <button
          onClick={() => {
            setStatus("processing");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            status === "processing"
              ? "bg-green-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Processing
          <span className="ml-2 bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs font-semibold">
            {processingTotal}
          </span>
        </button>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>

          {/* Sort by End Time */}
          <button
            onClick={() => handleSortChange("endTime")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              sortBy === "endTime"
                ? "bg-primary-blue text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            End Time{" "}
            {sortBy === "endTime" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>

          {/* Sort by Price */}
          <button
            onClick={() => handleSortChange("price")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              sortBy === "price"
                ? "bg-primary-blue text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Price {sortBy === "price" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>

          {/* Sort by Bid Count */}
          <button
            onClick={() => handleSortChange("bidCount")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              sortBy === "bidCount"
                ? "bg-primary-blue text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Bid Count{" "}
            {sortBy === "bidCount" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
        </div>
      </div>

      {/* Products List - Horizontal Cards */}
      <div className="space-y-4">
        {bids.map((bid) => (
          <BiddingProductCard key={bid._id} bid={bid} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm">
            Page {page} / {totalPages}
            {status !== "all" && (
              <span className="text-gray-500 ml-2">
                ({status.charAt(0).toUpperCase() + status.slice(1)})
              </span>
            )}
          </span>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BiddingContainer;
