import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, X } from "lucide-react";
import type { Product } from "@interfaces/product";
import ProductImage from "../product/ProductImage";
import { sellerApi } from "@services/seller.api";
import DescriptionHistoryPopover from "./DescriptionHistoryPopover";
import {
  checkRecentlyAdded,
  formatPrice,
  getShortRemainingTime,
} from "@utils/product";
import RichTextEditor from "@components/shared/RichTextEditor";
import { useAlertStore } from "@stores/useAlertStore";

interface SellerProductCardProps {
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
}

const SellerProductCard: React.FC<SellerProductCardProps> = ({
  product,
  onUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDescriptionPopover, setShowDescriptionPopover] = useState(false);
  const addAlert = useAlertStore((state) => state.addAlert);

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

  const handleAppendDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    setIsLoading(true);
    try {
      const updatedProduct = await sellerApi.appendDescription(
        _id,
        newDescription
      );
      onUpdate(updatedProduct);
      setNewDescription("");
      setIsModalOpen(false);
      addAlert("success", "Description appended successfully.");
    } catch (error) {
      console.error("Failed to append description", error);
      addAlert("error", "Failed to append description");
    } finally {
      setIsLoading(false);
    }
  };

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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Append Description
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAppendDescription} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Information
                </label>
                <RichTextEditor
                  value={newDescription}
                  onChange={setNewDescription}
                  limit={80}
                  placeholder="Enter additional details about the product..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Appending..." : "Append"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SellerProductCard;
