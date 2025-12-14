import React, { useState, useEffect } from "react";
import ProductCard from "@components/product/ProductCard";
import Pagination from "@components/pagination/Pagination";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import Spinner from "@components/ui/Spinner";
import { bidderApi } from "@services/bidder.api";
import { useAuthStore } from "@stores/useAuthStore";
import type { GetWatchlistResponse } from "@interfaces/watchlist";
import { useSearchParams } from "react-router-dom";
import { useAlertStore } from "@stores/useAlertStore";
import SidebarFilter from "@components/ui/SidebarFilter";
import { AlertCircle } from "lucide-react";

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
  
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [sortBy, setSortBy] = useState<
    "createdAt" | "endTime" | "currentPrice"
  >(sortByFromUrl);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(sortOrderFromUrl);
  
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ended">("all");

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
        setError(err instanceof Error ? err.message : "Error fetching watchlist");
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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [newSortBy, newSortOrder] = value.split("-") as [
      "createdAt" | "endTime" | "currentPrice",
      "asc" | "desc"
    ];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const handleRemoveFromWatchlist = async (productId: string) => {
    if (!token) return;

    try {
      setRemovingProductIds((prev) => new Set(prev).add(productId));
      await bidderApi.removeFromWatchlist(productId, token);

      setData((prevData) => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          watchlist: prevData.watchlist.filter(
            (item) => (item.product ? item.product._id : null) !== productId
          ),
          pagination: { ...prevData.pagination, total: prevData.pagination.total - 1 },
        };
      });

      addAlert("success", "Item removed from watchlist.");
      
      if (
        data?.watchlist.filter(i => i.product).length === 1 && 
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      addAlert("error", err.message || "Failed to remove item.");
    } finally {
      setRemovingProductIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  if (loading || isUrlChanging) return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
  );
  
  if (error) return <ErrorMessage text={error} />;
  
  const validItems = data?.watchlist || [];
  
  // Filter logic: Include null products in "Ended" or "All"
  const filteredItems = validItems.filter(item => {
    if (filterStatus === "all") return true;
    
    // If product is null, it counts as Ended/Unavailable
    if (!item.product) {
       return filterStatus === "ended";
    }

    const isEnded = new Date(item.product.endTime).getTime() < Date.now();
    if (filterStatus === "active") return !isEnded;
    if (filterStatus === "ended") return isEnded;
    return true;
  });

  if (!data || !filteredItems.length) {
    return <EmptyMessage text="No items match your filter." />;
  }

  // Count items for sidebar
  const activeCount = validItems.filter(i => i.product && new Date(i.product.endTime).getTime() >= Date.now()).length;
  // Ended includes valid expired products AND null products
  const endedCount = validItems.filter(i => !i.product || new Date(i.product.endTime).getTime() < Date.now()).length;

  const filters = [
    { label: "All Items", value: "all", count: validItems.length },
    { label: "Active", value: "active", count: activeCount, color: "bg-green-500" },
    { label: "Ended", value: "ended", count: endedCount, color: "bg-red-500" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Watchlist</h1>
        <p className="text-gray-600 mt-1">
          Tracking {data.pagination.total} item{data.pagination.total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-4">
          <SidebarFilter
            title="Filter Status"
            options={filters}
            currentValue={filterStatus}
            onFilterChange={(val) => setFilterStatus(val as any)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="text-sm text-gray-600 font-medium">
              {filteredItems.length} Result{filteredItems.length !== 1 ? "s" : ""}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</span>
              <div className="relative min-w-[200px]">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={handleSortChange}
                  className="appearance-none w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 pl-3 pr-10 py-2 cursor-pointer outline-none shadow-sm transition-all hover:border-blue-400"
                >
                  <option value="createdAt-desc">Recently Added</option>
                  <option value="endTime-asc">Ending Soonest</option>
                  <option value="endTime-desc">Ending Latest</option>
                  <option value="currentPrice-asc">Price: Low to High</option>
                  <option value="currentPrice-desc">Price: High to Low</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              if (!item.product) {
                // Unavailable Item Card
                return (
                  <div key={item._id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center text-center h-full min-h-[360px]">
                     <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                     </div>
                     <h3 className="text-gray-900 font-semibold mb-2">Item Unavailable</h3>
                     <p className="text-gray-500 text-sm mb-4">
                       This product is no longer available or was deleted.
                     </p>
                  </div>
                );
              }
              
              return (
                <ProductCard
                  key={item._id}
                  product={item.product}
                  showRemoveButton={true}
                  onRemove={() => handleRemoveFromWatchlist(item.product._id)}
                  isRemoving={removingProductIds.has(item.product._id)}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {filterStatus === "all" && data.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={data.pagination.page}
                totalPages={data.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistContainer;
