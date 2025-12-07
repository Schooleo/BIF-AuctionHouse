import React, { useEffect, useState } from "react";
import BidWinnerCard from "@components/seller/BidWinnerCard";
import { sellerApi } from "@services/seller.api";
import type { Product } from "@interfaces/product";
import Pagination from "@components/pagination/Pagination";
import { useLocation } from "react-router-dom";

const LIMIT = 8;

const BidWinnersContainer: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusRefresh, setStatusRefresh] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get("q") || "");
  }, [location.search]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await sellerApi.getSellerProducts({
          page,
          limit: LIMIT,
          search,
          sortBy,
          sortOrder,
          status: "bid_winner",
        });
        setProducts(data.products);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [page, search, sortBy, sortOrder, statusRefresh]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "default") {
      setSortBy("createdAt");
      setSortOrder("desc");
    } else if (value === "mostBidOn") {
      setSortBy("bidCount");
      setSortOrder("desc");
    } else if (value === "highestPriced") {
      setSortBy("currentPrice");
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <div className="flex-1 p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Bid Winners</h1>
        <div className="flex gap-4 w-full md:w-auto items-center">
          <div className="flex items-center">
            <label
              htmlFor="sort"
              className="mr-2 text-sm font-medium text-gray-700"
            >
              Sort:
            </label>
            <div className="relative">
              <select
                id="sort"
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary-blue focus:border-primary-blue cursor-pointer hover:border-gray-400 transition-colors"
                onChange={handleSortChange}
                defaultValue="default"
              >
                <option value="default">Default</option>
                <option value="mostBidOn">Most Bid-On</option>
                <option value="highestPriced">Highest Priced</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-6 text-lg">No active winners yet...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {products.map((product) => (
            <BidWinnerCard
              key={product._id}
              product={product}
              onRefresh={() => setStatusRefresh((prev) => prev + 1)}
            />
          ))}
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default BidWinnersContainer;
