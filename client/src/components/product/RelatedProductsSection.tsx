import type { Product } from "@interfaces/product";
import ProductCard from "./ProductCard";
import EmptyMessage from "@components/message/EmptyMessage";

interface RelatedProductSectionProps {
  related: Product[];
}

const RelatedProductSection: React.FC<RelatedProductSectionProps> = ({
  related,
}) => {
  console.log(related);

  if (related.length === 0)
    return <EmptyMessage text="No related products found..." />;

  return (
    <div className="related-products-section mt-12">
      <div className="flex overflow-x-auto gap-4 py-2 scrollbar-none">
        {related.map((product) => (
          <div key={product._id} className="shrink-0 w-64">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProductSection;
