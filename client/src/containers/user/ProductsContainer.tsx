import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SortBar from "@components/ui/SortBar";
import Pagination from "@components/pagination/Pagination";
import ProductCard from "@components/product/ProductCard";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import Spinner from "@components/ui/Spinner";
import { productApi } from "@services/product.api";
import type { Product, ProductSortOption, Category } from "@interfaces/product";
import type { IPagination, IPaginatedResponse } from "@interfaces/ui";
import ActiveFilters from "@components/ui/ActiveFilters";

const ITEMS_PER_PAGE = 10;

const defaultPagination: IPagination = {
  page: 1,
  limit: ITEMS_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
};

interface ProductsContainerProps {
  initialCategory?: string;
  initialQuery?: string;
  categories?: Category[];
}

const ProductsContainer: React.FC<ProductsContainerProps> = ({
  initialCategory = "",
  initialQuery = "",
  categories = [],
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<IPaginatedResponse<Product>>({
    data: [],
    pagination: defaultPagination,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sort = (searchParams.get("sort") as ProductSortOption) || "default";
  const category = searchParams.get("category") || initialCategory;
  const query = searchParams.get("q") || initialQuery;
  const minPrice = searchParams.get("min_price")
    ? Number(searchParams.get("min_price"))
    : undefined;
  const maxPrice = searchParams.get("max_price")
    ? Number(searchParams.get("max_price"))
    : undefined;
  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productApi.fetchProducts({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          categoryId: category,
          query: query,
          sort: sort,
          minPrice,
          maxPrice,
        });

        setData({
          data: response.data,
          pagination: response.pagination,
        });
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [category, query, sort, currentPage, minPrice, maxPrice]);

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: ProductSortOption) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", newSort);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  console.log(data);

  // --- Render Logic ---
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage text={error} />;
  if (!data.data.length) return <EmptyMessage text="No products found." />;

  return (
    <>
      <ActiveFilters categories={categories} />
      <SortBar sort={sort} setSort={handleSortChange} />

      <div className="products-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data.data.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>

      <Pagination
        currentPage={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default ProductsContainer;
