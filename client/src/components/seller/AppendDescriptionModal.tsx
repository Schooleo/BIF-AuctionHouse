import React, { useState } from "react";
import RichTextEditor from "@components/shared/RichTextEditor";
import PopUpWindow from "@components/ui/PopUpWindow";
import { sellerApi } from "@services/seller.api";
import { useAlertStore } from "@stores/useAlertStore";
import type { Product } from "@interfaces/product";

interface AppendDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onUpdate: (updatedProduct: Product) => void;
}

const AppendDescriptionModal: React.FC<AppendDescriptionModalProps> = ({
  isOpen,
  onClose,
  productId,
  onUpdate,
}) => {
  const [newDescription, setNewDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const addAlert = useAlertStore((state) => state.addAlert);

  const handleAppendDescription = async () => {
    if (!newDescription.trim()) return;

    setIsLoading(true);
    try {
      const updatedProduct = await sellerApi.appendDescription(
        productId,
        newDescription
      );
      onUpdate(updatedProduct);
      setNewDescription("");
      onClose(); // Close modal on success
      addAlert("success", "Description appended successfully.");
    } catch (error) {
      console.error("Failed to append description", error);
      addAlert("error", "Failed to append description");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Append Description"
      onSubmit={handleAppendDescription}
      submitText="Append"
      isLoading={isLoading}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Information
          </label>
          <RichTextEditor
            value={newDescription}
            onChange={setNewDescription}
            limit={100}
            placeholder="Enter additional details about the product..."
          />
        </div>
      </div>
    </PopUpWindow>
  );
};

export default AppendDescriptionModal;
