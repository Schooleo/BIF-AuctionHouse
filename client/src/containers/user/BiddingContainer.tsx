import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import type { BidItem } from "@interfaces/bidder";
import BiddingProductCard from "@components/product/BiddingProductCard";
import Spinner from "@components/ui/Spinner";
import SidebarFilter from "@components/ui/SidebarFilter";
import { AlertCircle } from "lucide-react";

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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [newSortBy, newSortOrder] = value.split("-") as [
      "endTime" | "price" | "bidCount",
      "asc" | "desc",
    ];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading || isUrlChanging) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button
          onClick={fetchBids}
          className="text-blue-600 hover:underline font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Sidebar options
  const filters = [
    {
      label: "All Bids",
      value: "all",
      count: activeTotal + awaitingTotal + processingTotal,
    },
    {
      label: "Active",
      value: "active",
      count: activeTotal,
      color: "bg-blue-500",
    },
    {
      label: "Awaiting",
      value: "awaiting",
      count: awaitingTotal,
      color: "bg-yellow-500",
    },
    {
      label: "Processing",
      value: "processing",
      count: processingTotal,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bids</h1>
        <p className="text-gray-600 mt-1">
          Manage your auctions and track your bidding status.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-4">
          <SidebarFilter
            title="Filter Status"
            options={filters}
            currentValue={status}
            onFilterChange={(val) => {
              setStatus(val as any);
              setPage(1);
            }}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="text-sm text-gray-600 font-medium">
              Running {activeTotal} active auction{activeTotal !== 1 ? "s" : ""}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Sort by:
              </span>
              <div className="relative min-w-[200px]">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={handleSortChange}
                  className="custom-select appearance-none w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-md pl-3 pr-10 py-2 cursor-pointer outline-none shadow-sm transition-all focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400"
                >
                  <option value="endTime-asc">Ending Soonest</option>
                  <option value="endTime-desc">Ending Latest</option>
                  <option value="price-desc">Highest Price</option>
                  <option value="price-asc">Lowest Price</option>
                  <option value="bidCount-desc">Most Bids</option>
                  <option value="bidCount-asc">Least Bids</option>
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          {bids.length > 0 ? (
            <div className="space-y-4">
              {bids.map((bid) => (
                <BiddingProductCard key={bid._id} bid={bid} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <AlertCircle
                  className="h-6 w-6 text-blue-400"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No auctions found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {status === "all"
                  ? "You haven't placed any bids yet."
                  : `You don't have any ${status} auctions.`}
              </p>
              {status === "all" ? (
                <button
                  onClick={() => navigate("/products")}
                  className="mt-6 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Start Bidding
                </button>
              ) : (
                <button
                  onClick={() => setStatus("all")}
                  className="mt-6 inline-flex items-center rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  View All Bids
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiddingContainer;
