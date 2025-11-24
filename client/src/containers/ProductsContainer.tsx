import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@components/product/ProductCard";
import SortBar from "@components/ui/SortBar";
import Spinner from "@components/ui/Spinner";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import Pagination from "@components/pagination/Pagination";
import { mockFetchProducts, getTopProducts } from "@utils/product";
import type { Product, ProductSortOption } from "@interfaces/product";
import type { IPagination, IPaginatedResponse } from "@interfaces/ui";

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
}

const ProductsContainer: React.FC<ProductsContainerProps> = ({
  initialCategory = "",
  initialQuery = "",
}) => {
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<IPaginatedResponse<Product>>({
    data: [],
    pagination: defaultPagination,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<ProductSortOption>(
    (searchParams.get("sort") as ProductSortOption) || "default"
  );
  const category = searchParams.get("category") || initialCategory;
  const query = searchParams.get("q") || initialQuery;

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await mockFetchProducts({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: query,
          categoryId: category,
        });

        let sortedData = response.data;
        if (sort !== "default") {
          sortedData = getTopProducts(sortedData, sort, sortedData.length);
        }

        setData({
          data: sortedData,
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
  }, [category, query, sort, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage) {
      setCurrentPage(newPage);

      // searchParams.set("page", newPage.toString());
      // history.push({ search: searchParams.toString() });
    }
  };

  const handleSortChange = (newSort: ProductSortOption) => {
    setSort(newSort);
    setCurrentPage(1);
  };

  // --- Render Logic ---
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage text={error} />;
  if (!data.data.length) return <EmptyMessage text="No products found." />;

  return (
    <>
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
