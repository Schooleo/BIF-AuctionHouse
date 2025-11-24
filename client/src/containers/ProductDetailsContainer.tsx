import React from "react";
import ProductImageCard from "@components/product/ProductImageCard";
import ProductInfoCard from "@components/product/ProductInfoCard";
import { QnACard, type IQuestionAnswer } from "@components/product/QnACard";
import RelatedProductSection from "@components/product/RelatedProductsSection";
import type { Product } from "@interfaces/product";
import { useAuthStore } from "@stores/useAuthStore";

interface ProductDetailsContainerProps {
  product: Product;
}

const ProductDetailsContainer: React.FC<ProductDetailsContainerProps> = ({
  product,
}) => {
  const { user } = useAuthStore();
  const isGuest = !user;

  const qnas: IQuestionAnswer[] =
    (product.questions ?? []).map((q) => ({
      _id: q._id,
      question: q.question,
      questionerName: q.questioner.name,
      askedAt: q.askedAt,
      answer: q.answer,
      answeredAt: q.answeredAt,
    })) ?? [];

  return (
    <div className="py-6">
      <div className="product-details-container max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-start gap-20 mb-8">
        <div className="w-full md:w-5/12 shrink-0 px-4 md:px-0">
          <ProductImageCard
            images={product.images.length ? product.images : ["/no-image.jpg"]}
          />
        </div>

        <div className="md:w-5/12 px-4 md:px-0">
          <ProductInfoCard product={product} isGuest={isGuest} />
        </div>
      </div>

      <div className="mb-8 px-4 md:px-0 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Questions & Answers</h2>
        <QnACard qnas={qnas} />
      </div>

      <div className="max-w-6xl mx-auto">
        <RelatedProductSection currentProduct={product} />
      </div>
    </div>
  );
};

export default ProductDetailsContainer;
