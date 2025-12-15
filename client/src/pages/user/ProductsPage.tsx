import React from "react";
import ProductsContainer from "@containers/user/ProductsContainer";
import { useSearchParams, useOutletContext } from "react-router-dom";
import type { Category } from "@interfaces/product";

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { categories } = useOutletContext<{ categories: Category[] }>() || { categories: [] };

  const initialCategory = searchParams.get("category") || "";
  const initialQuery = searchParams.get("q") || "";

  return (
    <div className="products-page-wrapper py-8">
      <ProductsContainer
        initialCategory={initialCategory}
        initialQuery={initialQuery}
        categories={categories}
      />
    </div>
  );
};

export default ProductsPage;
