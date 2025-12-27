import React from "react";
import ProductsContainer from "@containers/user/ProductsContainer";
import { useSearchParams } from "react-router-dom";

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialQuery = searchParams.get("q") || "";

  return (
    <div className="products-page-wrapper py-8">
      <ProductsContainer
        initialCategory={initialCategory}
        initialQuery={initialQuery}
      />
    </div>
  );
};

export default ProductsPage;
