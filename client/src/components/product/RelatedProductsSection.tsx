import React, { useEffect, useState } from "react";
import type { Product } from "@interfaces/product";
import ProductCard from "./ProductCard";
import { getRelatedProducts } from "@utils/product";

interface RelatedProductSectionProps {
  currentProduct: Product;
}

const RelatedProductSection: React.FC<RelatedProductSectionProps> = ({
  currentProduct,
}) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API call
    setLoading(true);
    const related = getRelatedProducts(currentProduct);
    setRelatedProducts(related.slice(0, 5)); // Giới hạn tối đa 5 sản phẩm
    setLoading(false);
  }, [currentProduct]);

  if (loading) {
    return <div className="text-center py-8">Loading related products...</div>;
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="related-products-section mt-12">
      <h2 className="text-2xl font-semibold mb-6">Related Products</h2>

      <div className="flex overflow-x-auto gap-4 py-2 scrollbar-none">
        {relatedProducts.map((product) => (
          <div key={product._id} className="shrink-0 w-64">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProductSection;
