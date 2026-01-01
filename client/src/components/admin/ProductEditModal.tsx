import React, { useState, useEffect } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import RichTextEditor from "@components/shared/RichTextEditor";
import ImageUpload from "@components/shared/ImageUpload";
import type { Product, Category } from "@interfaces/product";
import { productApi } from "@services/product.api";

interface AdminProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSubmit: (data: any) => Promise<void>;
  hasActiveBids: boolean;
}

const AdminProductEditModal: React.FC<AdminProductEditModalProps> = ({
  isOpen,
  onClose,
  product,
  onSubmit,
  hasActiveBids,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    category: typeof product.category === "string" ? product.category : product.category._id,
    mainImage: product.mainImage || "",
    subImages: product.subImages || ["", "", ""],
    description: product.description,
    startingPrice: product.startingPrice.toString(),
    stepPrice: product.stepPrice.toString(),
    buyNowPrice: product.buyNowPrice?.toString() || "",
    autoExtends: product.autoExtends || false,
    allowUnratedBidders: product.allowUnratedBidders || false,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productApi.fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubImageChange = (index: number, value: string) => {
    const newSubImages = [...formData.subImages];
    newSubImages[index] = value;
    setFormData((prev) => ({ ...prev, subImages: newSubImages }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updateData: any = {};

      // Only include changed fields
      if (formData.name !== product.name) updateData.name = formData.name;
      if (formData.category !== (typeof product.category === "string" ? product.category : product.category._id)) {
        updateData.category = formData.category;
      }
      if (formData.mainImage !== product.mainImage) updateData.mainImage = formData.mainImage;
      
      const cleanSubImages = formData.subImages.filter(Boolean);
      if (JSON.stringify(cleanSubImages) !== JSON.stringify(product.subImages)) {
        updateData.subImages = cleanSubImages;
      }

      if (formData.description !== product.description) {
        updateData.description = formData.description;
      }

      if (formData.startingPrice !== product.startingPrice.toString()) {
        updateData.startingPrice = Number(formData.startingPrice);
      }

      if (formData.stepPrice !== product.stepPrice.toString()) {
        updateData.stepPrice = Number(formData.stepPrice);
      }

      if (formData.buyNowPrice) {
        const buyNowPrice = Number(formData.buyNowPrice);
        if (buyNowPrice !== product.buyNowPrice) {
          updateData.buyNowPrice = buyNowPrice;
        }
      }

      if (formData.autoExtends !== product.autoExtends) {
        updateData.autoExtends = formData.autoExtends;
      }

      if (formData.allowUnratedBidders !== product.allowUnratedBidders) {
        updateData.allowUnratedBidders = formData.allowUnratedBidders;
      }

      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      await onSubmit(updateData);
      onClose();
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Product"
      submitText="Save Changes"
      onSubmit={handleSubmit}
      isLoading={loading}
      size="xl"
      noPadding={true}
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-6">
        {hasActiveBids && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            This auction has active bids. Only description, end time, and settings can be updated.
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={hasActiveBids}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={hasActiveBids}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <React.Fragment key={cat._id}>
                <option value={cat._id} className="font-semibold">
                  {cat.name}
                </option>
                {cat.children?.map((sub) => (
                  <option key={sub._id} value={sub._id} className="pl-4">
                    ↳ {sub.name}
                  </option>
                ))}
              </React.Fragment>
            ))}
          </select>
        </div>

        {/* Main Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Image *
          </label>
          {hasActiveBids ? (
            <div className="relative">
              <ImageUpload
                value={formData.mainImage}
                onChange={() => {}}
                onRemove={() => {}}
              />
              <div className="absolute inset-0 bg-gray-100 bg-opacity-60 cursor-not-allowed rounded-lg flex items-center justify-center">
                <span className="text-sm text-gray-600 font-medium">Cannot edit during active auction</span>
              </div>
            </div>
          ) : (
            <ImageUpload
              value={formData.mainImage}
              onChange={(url) => setFormData((prev) => ({ ...prev, mainImage: url }))}
              onRemove={() => setFormData((prev) => ({ ...prev, mainImage: "" }))}
            />
          )}
        </div>

        {/* Sub Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Images (At least 3) *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.subImages.map((img, idx) => (
              <div key={idx} className="relative">
                {hasActiveBids ? (
                  <>
                    <ImageUpload
                      value={img}
                      onChange={() => {}}
                      onRemove={() => {}}
                      height="h-32"
                    />
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-60 cursor-not-allowed rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-600">Locked</span>
                    </div>
                  </>
                ) : (
                  <ImageUpload
                    value={img}
                    onChange={(url) => handleSubImageChange(idx, url)}
                    onRemove={() => handleSubImageChange(idx, "")}
                    height="h-32"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Price *
            </label>
            <input
              type="number"
              name="startingPrice"
              value={formData.startingPrice}
              onChange={handleChange}
              disabled={hasActiveBids}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="1000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step Price *
            </label>
            <input
              type="number"
              name="stepPrice"
              value={formData.stepPrice}
              onChange={handleChange}
              disabled={hasActiveBids}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="1000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buy Now Price (Optional)
            </label>
            <input
              type="number"
              name="buyNowPrice"
              value={formData.buyNowPrice}
              onChange={handleChange}
              disabled={hasActiveBids}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="0"
              step="1000"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="autoExtends"
              checked={formData.autoExtends}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-extend auction time</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="allowUnratedBidders"
              checked={formData.allowUnratedBidders}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Allow Unrated Bidders</span>
          </label>
        </div>
      </div>
    </PopUpWindow>
  );
};

export default AdminProductEditModal;