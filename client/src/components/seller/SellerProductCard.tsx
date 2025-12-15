import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import type { Product } from "@interfaces/product";
import ProductImage from "../product/ProductImage";
import DescriptionHistoryPopover from "./DescriptionHistoryPopover";
import {
  checkRecentlyAdded,
  formatPrice,
  getShortRemainingTime,
} from "@utils/product";
import AppendDescriptionModal from "./AppendDescriptionModal";

interface SellerProductCardProps {
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
}

const SellerProductCard: React.FC<SellerProductCardProps> = ({
  product,
  onUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDescriptionPopover, setShowDescriptionPopover] = useState(false);

  const {
    _id,
    name,
    mainImage,
    currentPrice,
    startTime,
    endTime,
    description,
    descriptionHistory,
    bidCount,
  } = product;

  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full">
        <div className="relative">
          <ProductImage
            image={mainImage ?? ""}
            recentlyAdded={checkRecentlyAdded(startTime)}
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors text-gray-600 z-10"
            title="Append Description"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col grow space-y-3">
          <Link to={`/seller/products/${_id}`} className="block">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
              {name}
            </h3>
          </Link>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Current Price:</span>
            <span className="font-bold text-blue-600">
              {formatPrice(currentPrice)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Bids:</span>
            <span className="font-medium">{bidCount || 0}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Time Left:</span>
            <span
              className={`font-medium ${
                getShortRemainingTime(endTime) === "Ended"
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {getShortRemainingTime(endTime)}
            </span>
          </div>

          <div className="pt-3 border-t border-gray-100 mt-auto relative">
            <button
              ref={triggerRef}
              onClick={() => setShowDescriptionPopover(!showDescriptionPopover)}
              className="text-sm text-blue-600 hover:underline font-medium flex items-center"
            >
              View Description History
            </button>

            {showDescriptionPopover && (
              <DescriptionHistoryPopover
                description={description}
                descriptionHistory={descriptionHistory}
                onClose={() => setShowDescriptionPopover(false)}
                triggerRef={triggerRef}
              />
            )}
          </div>
        </div>
      </div>

      <AppendDescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={_id}
        onUpdate={onUpdate}
      />
    </>
  );
};

export default SellerProductCard;
