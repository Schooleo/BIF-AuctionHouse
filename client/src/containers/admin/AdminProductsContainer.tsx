import React, {
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "react-router-dom";
import { adminApi } from "@services/admin.api";
import type { Product, Category } from "@interfaces/product";
import AdminEndedProductCard from "@components/admin/EndedProductCard";
import AdminActiveProductCard from "@components/admin/ActiveProductCard";
import { Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import Spinner from "@components/ui/Spinner";
import AdminProductFilterModal from "@components/admin/ProductFilterModal";
import { formatPrice } from "@utils/product";

interface AdminProductsContainerProps {
  status: "active" | "ended";
}

const SORT_OPTIONS = {
  active: [
    { value: "createdAt-desc", label: "Nearest Creation Time" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "endTime-asc", label: "Ending Soonest" },
    { value: "endTime-desc", label: "Ending Latest" },
    { value: "currentPrice-desc", label: "Highest Price" },
    { value: "currentPrice-asc", label: "Lowest Price" },
    { value: "bidCount-desc", label: "Most Bids" },
    { value: "bidCount-asc", label: "Least Bids" },
  ],
  ended: [
    { value: "endTime-desc", label: "Longest End Time" },
    { value: "endTime-asc", label: "Shortest End Time" },
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "currentPrice-desc", label: "Highest Price" },
    { value: "currentPrice-asc", label: "Lowest Price" },
    { value: "bidCount-desc", label: "Most Bids" },
    { value: "bidCount-asc", label: "Least Bids" },
  ],
};

const limit = 8;
const SLIDER_MAX = 500000000;

interface ProductQuery {
  page: number;
  limit: number;
  status: "active" | "ended";
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
  categories?: string;
}

const AdminProductsContainer: React.FC<AdminProductsContainerProps> = ({
  status,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // Search state (controlled locally to prevent refresh)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Filter states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  // Sort state
  const defaultSort = status === "active" ? "createdAt-desc" : "endTime-desc";
  const [sortValue, setSortValue] = useState(defaultSort);
  const [sortBy, sortOrder] = sortValue.split("-") as [string, "asc" | "desc"];

  const sortOptions = SORT_OPTIONS[status];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch]);

  // Update URL when debounced search changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      newParams.set("q", debouncedSearch);
    } else {
      newParams.delete("q");
    }
    newParams.set("page", "1");
    setSearchParams(newParams, { replace: true });
    setPage(1);
  }, [debouncedSearch, searchParams, setSearchParams]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const categoryId = selectedCategory ? selectedCategory._id : undefined;

      const query: ProductQuery = {
        page,
        limit,
        status,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        minPrice,
        maxPrice,
      };

      if (categoryId) query.categories = categoryId;

      const result = await adminApi.getProducts(query);

      setProducts(result.products);
      setTotalDocs(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    sortBy,
    sortOrder,
    status,
    selectedCategory,
    minPrice,
    maxPrice,
  ]);

  // Reset filters/page when status changes
  useLayoutEffect(() => {
    setPage(1);
    setSortValue(status === "active" ? "createdAt-desc" : "endTime-desc");
  }, [status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleApplyFilters = (filters: {
    category?: Category;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    setSelectedCategory(filters.category || null);

    // Only apply price filter if it differs from default (0 - MAX)
    if (filters.minPrice === 0 && filters.maxPrice === SLIDER_MAX) {
      setMinPrice(undefined);
      setMaxPrice(undefined);
    } else {
      setMinPrice(filters.minPrice);
      setMaxPrice(filters.maxPrice);
    }

    setPage(1); // Reset to first page
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSortValue(defaultSort);
    setPage(1);
  };

  const handleRemoveCategory = () => {
    setSelectedCategory(null);
    setPage(1);
  };

  const handleRemovePriceFilter = () => {
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-800">
          {status === "active" ? "Active Products" : "Ended Products"}
        </h1>
        <p className="text-sm text-gray-500">
          Manage your product inventory, monitor status, and update listings.
          Currently viewing {totalDocs} products.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by product name, category, or description..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-2">
          Search priority: Product name → Category → Description
        </p>
        {/* Active Filters */}
        {(selectedCategory ||
          minPrice !== undefined ||
          maxPrice !== undefined ||
          sortValue !== defaultSort) && (
          <div className="flex flex-wrap gap-2 items-center mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-700 font-medium">
              Active Filters:
            </span>
            {selectedCategory && (
              <span
                key={selectedCategory._id}
                className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
              >
                {selectedCategory.name}
                <button
                  onClick={handleRemoveCategory}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(minPrice !== undefined || maxPrice !== undefined) && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Price:{" "}
                {minPrice !== undefined ? `${formatPrice(minPrice)}` : "0"} -{" "}
                {maxPrice !== undefined ? `${formatPrice(maxPrice)}` : "∞"}
                <button
                  onClick={handleRemovePriceFilter}
                  className="hover:text-green-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortValue !== defaultSort && (
              <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Sorted
                <button
                  onClick={() => setSortValue(defaultSort)}
                  className="hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-red-600 hover:text-red-800 font-medium underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Sort & Pagination Control Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          <div className="flex gap-3">
            {/* Filter Button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm relative"
            >
              <Filter size={18} />
              <span className="font-medium">Apply Filters</span>
              {(selectedCategory ||
                minPrice !== undefined ||
                maxPrice !== undefined) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <div className="relative">
              <select
                id="sort"
                value={sortValue}
                onChange={(e) => {
                  setSortValue(e.target.value);
                  setPage(1);
                }}
                className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pagination Controls in Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-20 text-center">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px] transition-all duration-200">
            <Spinner />
          </div>
        )}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) =>
              status === "active" ? (
                <AdminActiveProductCard key={product._id} product={product} />
              ) : (
                <AdminEndedProductCard key={product._id} product={product} />
              )
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <p className="text-gray-500">
              No products found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <AdminProductFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={{
          category: selectedCategory || undefined,
          minPrice,
          maxPrice,
        }}
      />
    </div>
  );
};

export default AdminProductsContainer;
