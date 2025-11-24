import React from "react";
import { useParams } from "react-router-dom";
import { allMockProducts } from "@utils/product";
import ProductDetailsContainer from "@containers/ProductDetailsContainer";
import EmptyMessage from "@components/message/EmptyMessage";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams();

  const product = allMockProducts.find((p) => p._id === id);

  console.log("ProductDetailsPage - product:", product);

  if (!product) {
    return <EmptyMessage text="Product not found..." />;
  }

  return <ProductDetailsContainer product={product} />;
};

export default ProductDetailsPage;
