import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { adminApi } from "@services/admin.api";
import type { Product, Category } from "@interfaces/product";
import AdminEndedProductCard from "@components/admin/EndedProductCard";
import AdminActiveProductCard from "@components/admin/ActiveProductCard";
import { Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import Spinner from "@components/ui/Spinner";
import AdminProductFilterModal from "@components/admin/ProductFilterModal";
import Pagination from "@components/pagination/Pagination";

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

const AdminProductsContainer: React.FC<AdminProductsContainerProps> = ({
  status,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Search state (controlled locally to prevent refresh)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Sort state
  const defaultSort = status === "active" ? "createdAt-desc" : "endTime-desc";
  const [sortValue, setSortValue] = useState(defaultSort);
  const [sortBy, sortOrder] = sortValue.split("-") as [string, "asc" | "desc"];

  const limit = 12;
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
  }, [debouncedSearch]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await adminApi.getProducts({
        page,
        limit,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        status,
        categories:
          selectedCategories.length > 0
            ? selectedCategories.map((c) => c._id).join(",")
            : undefined,
        minPrice,
        maxPrice,
      });

      setProducts(result.products);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    sortBy,
    sortOrder,
    status,
    selectedCategories,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleApplyFilters = (filters: {
    categories: Category[];
    minPrice?: number;
    maxPrice?: number;
  }) => {
    setSelectedCategories(filters.categories);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSortValue(defaultSort);
    setPage(1);
  };

  const handleRemoveCategory = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c._id !== categoryId));
    setPage(1);
  };

  const handleRemovePriceFilter = () => {
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPage(1);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    sortValue !== defaultSort;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {status === "active" ? "Active Products" : "Ended Products"}
          </h1>
          <p className="text-gray-600 mt-1">
            {total} product{total !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm relative"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
        </div>
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
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
          <span className="text-sm text-gray-700 font-medium">
            Active Filters:
          </span>
          {selectedCategories.map((cat) => (
            <span
              key={cat._id}
              className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
            >
              {cat.name}
              <button
                onClick={() => handleRemoveCategory(cat._id)}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {(minPrice !== undefined || maxPrice !== undefined) && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Price:{" "}
              {minPrice !== undefined
                ? `${minPrice.toLocaleString()}`
                : "0"}{" "}
              -{" "}
              {maxPrice !== undefined ? `${maxPrice.toLocaleString()}` : "∞"}
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

      {/* Sort & Pagination Control Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
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
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : products.length > 0 ? (
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

      {/* Filter Modal */}
      <AdminProductFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={{
          categories: selectedCategories,
          minPrice,
          maxPrice,
        }}
      />
    </div>
  );
};

export default AdminProductsContainer;