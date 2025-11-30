import { useEffect, useState } from "react";
import { checkRecentlyAdded } from "@utils/product";
import ProductImageCard from "@components/product/ProductImageCard";
import ProductInfoCard from "@components/product/ProductInfoCard";
import { QnACard, type IQuestionAnswer } from "@components/product/QnACard";
import RelatedProductSection from "@components/product/RelatedProductsSection";
import Spinner from "@components/ui/Spinner";
import ErrorMessage from "@components/message/ErrorMessage";
import EmptyMessage from "@components/message/EmptyMessage";
import { productApi } from "@services/product.api";
import type { QuestionAnswer, Product } from "@interfaces/product";
import { useAuthStore } from "@stores/useAuthStore";

interface ProductDetailsContainerProps {
  id: string;
}

const ProductDetailsContainer: React.FC<ProductDetailsContainerProps> = ({
  id,
}) => {
  const { user } = useAuthStore();
  const isGuest = !user;
  const [product, setProduct] = useState<Product | null>(null);
  const [QNA, setQNA] = useState<QuestionAnswer[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productApi.fetchProductDetails({ id });
        console.log(response);
        setProduct(response.product);
        setRelatedProducts(response.related);
        setQNA(response.questions);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage text={error} />;
  if (!product) return <EmptyMessage text="No product found." />;

  const qnas: IQuestionAnswer[] =
    (QNA ?? []).map((q) => ({
      _id: q._id,
      question: q.question,
      questionerName: q.questioner.name,
      askedAt: q.askedAt,
      answer: q.answer,
      answeredAt: q.answeredAt,
    })) ?? [];

  const allImages: string[] = [];

  if (product.mainImage) {
    allImages.push(product.mainImage);
  }

  if (product.subImages && Array.isArray(product.subImages)) {
    allImages.push(...product.subImages);
  }

  const handleUpdateProduct = (updatedData: any) => {
    setProduct((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        currentPrice: updatedData.currentPrice,
        bidCount: updatedData.bidCount,
        highestBidder: updatedData.currentBidder,
      };
    });
  };

  return (
    <div className="py-6">
      <div className="product-details-container max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-start gap-20 mb-8">
        <div className="w-full md:w-5/12 shrink-0 px-4 md:px-0">
          <ProductImageCard
            images={allImages}
            recentlyAdded={checkRecentlyAdded(product.startTime)}
          />
        </div>

        <div className="md:w-5/12 px-4 md:px-0">
          <ProductInfoCard
            product={product}
            isGuest={isGuest}
            onUpdateProduct={handleUpdateProduct}
          />
        </div>
      </div>

      <div className="mb-8 px-4 md:px-0 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Questions & Answers</h2>
        <QnACard qnas={qnas} />
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Related Products</h2>
        <RelatedProductSection related={relatedProducts} />
      </div>
    </div>
  );
};

export default ProductDetailsContainer;
