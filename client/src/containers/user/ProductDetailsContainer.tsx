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
import AskQuestionModal from "@components/product/AskQuestionModal";

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

  const [isAskQuestionModalOpen, setIsAskQuestionModalOpen] = useState(false);

  // Compute auction state for Ask Question button
  const isAuctionEnded = product
    ? new Date() > new Date(product.endTime)
    : false;
  const isWinnerConfirmed = product?.winnerConfirmed === true;
  const currentUserId = user?.id;
  const winnerId = product?.currentBidder?._id || product?.highestBidder?._id;
  const isCurrentUserWinner = isWinnerConfirmed && currentUserId === winnerId;

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

  const handleQuestionAdded = (newQuestion: QuestionAnswer) => {
    // Optimistic update: Thêm question mới vào đầu array
    setQNA((prev) => [newQuestion, ...prev]);

    // Optional: Scroll to Q&A section
    const qnaSection = document.getElementById("qna-section");
    if (qnaSection) {
      qnaSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
    <div className="py-8">
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

      <div id="qna-section" className="mb-8 px-4 md:px-0 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Questions & Answers</h2>

          {!isGuest && (!isAuctionEnded || isCurrentUserWinner) && (
            <button
              onClick={() => setIsAskQuestionModalOpen(true)}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:scale-105 transition-transform duration-200 font-semibold text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Ask a Question
            </button>
          )}
        </div>

        <QnACard qnas={qnas} />
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Related Products</h2>
        <RelatedProductSection related={relatedProducts} />
      </div>

      {!isGuest && product && (
        <AskQuestionModal
          isOpen={isAskQuestionModalOpen}
          onClose={() => setIsAskQuestionModalOpen(false)}
          productId={product._id}
          productName={product.name}
          onQuestionAdded={handleQuestionAdded}
        />
      )}
    </div>
  );
};

export default ProductDetailsContainer;
