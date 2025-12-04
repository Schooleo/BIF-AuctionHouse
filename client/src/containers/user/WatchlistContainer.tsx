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
import { set } from "zod";
import { useAlertStore } from "@stores/useAlertStore";

const ITEMS_PER_PAGE = 10;

const WatchlistContainer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [data, setData] = useState<GetWatchlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingProductIds, setRemovingProductIds] = useState<Set<string>>(
    new Set()
  );
  const { addAlert } = useAlertStore((state) => state);
  // Get page from URL params, default to 1
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await bidderApi.getWatchlist(
          token,
          currentPage,
          ITEMS_PER_PAGE
        );

        setData(response);
      } catch (err: any) {
        console.error("Error fetching watchlist:", err);
        setError(
          err.message || "An error occurred while fetching the watchlist."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
    window.scrollTo(0, 0);
  }, [currentPage, token, user, navigate]);

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      // Update URL params
      setSearchParams({ page: page.toString() });
    }
  };

  if (loading) return <Spinner />;
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
