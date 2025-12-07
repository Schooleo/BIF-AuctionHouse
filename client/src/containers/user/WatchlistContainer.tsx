import React, { useState, useEffect } from "react";
import ProductCard from "@components/product/ProductCard";
import Pagination from "@components/pagination/Pagination";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import Spinner from "@components/ui/Spinner";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import type { GetWatchlistResponse } from "@interfaces/watchlist";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAlertStore } from "@stores/useAlertStore";

const ITEMS_PER_PAGE = 10;

const validatePage = (pageStr: string | null): number => {
  const parsed = parseInt(pageStr || "1");
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

const validateSortBy = (
  sortByStr: string | null
): "createdAt" | "endTime" | "currentPrice" => {
  const valid = ["createdAt", "endTime", "currentPrice"];
  return valid.includes(sortByStr || "") ? (sortByStr as any) : "createdAt";
};

const validateSortOrder = (orderStr: string | null): "asc" | "desc" => {
  return orderStr === "asc" ? "asc" : "desc";
};

const WatchlistContainer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = useAuthStore((state) => state.token);

  const pageFromUrl = validatePage(searchParams.get("page"));
  const sortByFromUrl = validateSortBy(searchParams.get("sortBy"));
  const sortOrderFromUrl = validateSortOrder(searchParams.get("sortOrder"));

  const [data, setData] = useState<GetWatchlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingProductIds, setRemovingProductIds] = useState<Set<string>>(
    new Set()
  );
  const { addAlert } = useAlertStore((state) => state);
  const [isUrlChanging, setIsUrlChanging] = useState(false);
  // Get page from URL params, default to 1
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [sortBy, setSortBy] = useState<
    "createdAt" | "endTime" | "currentPrice"
  >(sortByFromUrl);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(sortOrderFromUrl);

  useEffect(() => {
    const newPage = validatePage(searchParams.get("page"));
    const newSortBy = validateSortBy(searchParams.get("sortBy"));
    const newSortOrder = validateSortOrder(searchParams.get("sortOrder"));

    if (
      newPage !== currentPage ||
      newSortBy !== sortBy ||
      newSortOrder !== sortOrder
    ) {
      setIsUrlChanging(true);
      setCurrentPage(newPage);
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    }
  }, [searchParams]);

  useEffect(() => {
    const params: Record<string, string> = {};

    if (currentPage !== 1) params.page = currentPage.toString();
    if (sortBy !== "createdAt") params.sortBy = sortBy;
    if (sortOrder !== "desc") params.sortOrder = sortOrder;

    setSearchParams(params, { replace: true });
  }, [currentPage, sortBy, sortOrder, setSearchParams]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const response = await bidderApi.getWatchlist(
          token,
          currentPage,
          ITEMS_PER_PAGE,
          sortBy,
          sortOrder
        );

        setData(response);
      } catch (err) {
        console.error("Error fetching watchlist:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An error occurred while fetching the watchlist.";
        setError(errorMessage);
      } finally {
        setLoading(false);
        setIsUrlChanging(false);
      }
    };

    fetchWatchlist();
    window.scrollTo(0, 0);
  }, [currentPage, sortBy, sortOrder, token]);

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const handleSortChange = (
    newSortBy: "createdAt" | "endTime" | "currentPrice"
  ) => {
    if (newSortBy === "createdAt") {
      // Recently Added always DESC (newest first), no toggle
      setSortBy("createdAt");
      setSortOrder("desc");
    } else if (newSortBy === sortBy) {
      // Toggle sort order if clicking same field (only for endTime and currentPrice)
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      // Change field, reset to desc
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to page 1 when sorting changes
  };

  if (loading || isUrlChanging) return <Spinner />;
  if (error) return <ErrorMessage text={error} />;
  if (!data || !data.watchlist.length) {
    return (
      <EmptyMessage text="Your watchlist is empty. Start adding products you're interested in!" />
    );
  }

  const handleRemoveFromWatchlist = async (productId: string) => {
    if (!token) {
      addAlert(
        "error",
        "You must be logged in to remove items from your watchlist."
      );
      return;
    }

    try {
      setRemovingProductIds((prev) => new Set(prev).add(productId));

      await bidderApi.removeFromWatchlist(productId, token);

      const cardElement = document.querySelector(
        `[data-product-id="${productId}"]`
      );
      if (cardElement) {
        cardElement.classList.add("animate-fade-out");
        await new Promise((resolve) => setTimeout(resolve, 300)); // Wait animation
      }

      setData((prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          watchlist: prevData.watchlist.filter(
            (item) => item.product._id !== productId
          ),
          pagination: {
            ...prevData.pagination,
            total: prevData.pagination.total - 1,
          },
        };
      });

      addAlert("success", "Product removed from watchlist.");

      if (data?.watchlist.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
        setSearchParams({ page: (currentPage - 1).toString() });
      }
    } catch (err: any) {
      console.error("Error removing product from watchlist:", err);
      addAlert(
        "error",
        err.message ||
          "An error occurred while removing the product from the watchlist."
      );
    } finally {
      setRemovingProductIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  return (
    <div className="watchlist-container">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          My Watchlist
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          You're watching {data.pagination.total} product
          {data.pagination.total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>

          {/* Sort by Recently Added */}
          <button
            onClick={() => handleSortChange("createdAt")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              sortBy === "createdAt"
                ? "bg-primary-blue text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Recently Added
          </button>

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
            onClick={() => handleSortChange("currentPrice")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              sortBy === "currentPrice"
                ? "bg-primary-blue text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Price{" "}
            {sortBy === "currentPrice" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
        </div>

        {/* Sort Info */}
        <div className="text-xs text-gray-500">
          {sortBy === "createdAt" && "Newest first"}
          {sortBy === "endTime" &&
            (sortOrder === "desc" ? "Ending soon" : "Latest end time")}
          {sortBy === "currentPrice" &&
            (sortOrder === "desc" ? "Highest price" : "Lowest price")}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {data.watchlist.map((item) => (
          <ProductCard
            key={item._id}
            product={item.product}
            showRemoveButton={true}
            onRemove={() => handleRemoveFromWatchlist(item.product._id)}
            isRemoving={removingProductIds.has(item.product._id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default WatchlistContainer;
