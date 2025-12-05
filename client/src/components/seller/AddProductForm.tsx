import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sellerApi } from "@services/seller.api";
import { productApi } from "@services/product.api";
import type { Category } from "@interfaces/product";
import { Plus, X } from "lucide-react";
import RichTextEditor from "@components/shared/RichTextEditor";
import { z } from "zod";

const productSchema = z
  .object({
    name: z
      .string()
      .min(1, "Product name is required")
      .max(100, "Name must be less than 100 characters"),
    category: z.string().min(1, "Category is required"),
    mainImage: z.url("Main image must be a valid URL"),
    subImages: z.array(z.string()).superRefine((items, ctx) => {
      let validCount = 0;
      items.forEach((item, index) => {
        if (index < 3 && !item) {
          ctx.addIssue({
            code: "custom",
            message: "This image is required",
            path: [index],
          });
        } else if (item && !z.string().url().safeParse(item).success) {
          ctx.addIssue({
            code: "custom",
            message: "Must be a valid URL",
            path: [index],
          });
        }
        if (item) validCount++;
      });
      if (validCount < 3) {
        ctx.addIssue({
          code: "custom",
          message: "At least 3 sub-images are required",
          path: [], // General error for the array
        });
      }
    }),
    description: z.string().min(1, "Description is required"),
    startingPrice: z
      .string()
      .min(1, "Starting price is required")
      .transform((val) => Number(val.replace(/,/g, "")))
      .refine(
        (val) => !isNaN(val) && val >= 100000,
        "Starting price must be at least 100,000 VND"
      ),
    stepPrice: z
      .string()
      .min(1, "Step price is required")
      .transform((val) => Number(val.replace(/,/g, "")))
      .refine(
        (val) => !isNaN(val) && val >= 10000,
        "Step price must be at least 10,000 VND"
      ),
    buyNowPrice: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val.replace(/,/g, "")) : undefined))
      .refine(
        (val) => val === undefined || (!isNaN(val) && val >= 0),
        "Price must be non-negative"
      ),
    endTime: z
      .string()
      .refine(
        (val) => new Date(val) > new Date(),
        "End time must be in the future"
      ),
    autoExtends: z.boolean(),
    allowUnratedBidders: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.buyNowPrice !== undefined) {
      const minBuyNow = data.startingPrice + data.stepPrice;
      if (data.buyNowPrice < minBuyNow) {
        ctx.addIssue({
          code: "custom",
          message: `Buy Now price must be at least ${minBuyNow.toLocaleString()} VND (Starting + Step)`,
          path: ["buyNowPrice"],
        });
      }
    }
  });

type ProductFormErrors = {
  [key: string]: string;
};

const AddProductForm: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    mainImage: "",
    subImages: ["", "", ""],
    description: "",
    endTime: "",
    startingPrice: "",
    stepPrice: "",
    buyNowPrice: "",
    autoExtends: true,
    allowUnratedBidders: false,
  });

  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");

  useEffect(() => {
    // If formData.category is set (e.g. edit mode in future), try to determine main/sub
    if (formData.category && categories.length > 0) {
      // Check if it's a main category
      const isMain = categories.find((c) => c._id === formData.category);
      if (isMain) {
        setSelectedMainCategory(isMain._id);
      } else {
        // Must be a sub, find parent
        const parent = categories.find((c) =>
          c.children?.some((child) => child._id === formData.category)
        );
        if (parent) {
          setSelectedMainCategory(parent._id);
        }
      }
    }
  }, [formData.category, categories]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await productApi.fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let newValue: string | boolean = type === "checkbox" ? checked : value;

    // Handle currency formatting for price fields
    if (
      ["startingPrice", "stepPrice", "buyNowPrice"].includes(name) &&
      typeof newValue === "string"
    ) {
      // Remove non-digits
      const numericValue = newValue.replace(/\D/g, "");
      // Format with commas
      newValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleMainCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const mainCatId = e.target.value;
    setSelectedMainCategory(mainCatId);
    // Reset category to main, user must re-select sub if available
    setFormData((prev) => ({ ...prev, category: mainCatId }));
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleSubImageChange = (index: number, value: string) => {
    const newSubImages = [...formData.subImages];
    newSubImages[index] = value;
    setFormData((prev) => ({ ...prev, subImages: newSubImages }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(null);
    setErrors({});

    // Validate using Zod
    const result = productSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: ProductFormErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Filter out empty sub-images for the payload
      const validSubImages = formData.subImages.filter(
        (img) => img.trim() !== ""
      );

      const payload = {
        ...formData,
        subImages: validSubImages,
        startingPrice: result.data.startingPrice,
        stepPrice: result.data.stepPrice,
        buyNowPrice: result.data.buyNowPrice,
        endTime: new Date(formData.endTime).toISOString(),
      };

      await sellerApi.createProduct(payload);
      navigate("/seller/products");
    } catch (error) {
      setSubmitError((error as Error).message || "Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Basic Info */}
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            maxLength={100}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Vintage Camera"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={selectedMainCategory}
              onChange={handleMainCategoryChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category ? "border-red-500" : "border-gray-300"
              } ${!selectedMainCategory ? "text-gray-500" : "text-gray-900"}`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id} className="text-gray-900">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub Category
            </label>
            <select
              value={
                formData.category === selectedMainCategory
                  ? ""
                  : formData.category
              }
              onChange={handleSubCategoryChange}
              disabled={!selectedMainCategory}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category ? "border-red-500" : "border-gray-300"
              } ${formData.category === selectedMainCategory ? "text-gray-500" : "text-gray-900"} disabled:bg-gray-100 disabled:text-gray-400`}
            >
              <option value="">Select a sub-category</option>
              {categories
                .find((c) => c._id === selectedMainCategory)
                ?.children?.map((sub) => (
                  <option
                    key={sub._id}
                    value={sub._id}
                    className="text-gray-900"
                  >
                    {sub.name}
                  </option>
                ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category}</p>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Image URL *
            </label>
            <input
              type="url"
              name="mainImage"
              value={formData.mainImage}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.mainImage ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.mainImage && (
              <p className="mt-1 text-sm text-red-500">{errors.mainImage}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub Images URLs (Min 3) *
            </label>
            <div className="space-y-3">
              {formData.subImages.map((img, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-full">
                    <input
                      type="url"
                      value={img}
                      onChange={(e) =>
                        handleSubImageChange(index, e.target.value)
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors[`subImages.${index}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={`Sub Image URL ${index + 1}`}
                    />
                    {errors[`subImages.${index}`] && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors[`subImages.${index}`]}
                      </p>
                    )}
                  </div>
                  {index >= 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newSubImages = formData.subImages.filter(
                          (_, i) => i !== index
                        );
                        setFormData((prev) => ({
                          ...prev,
                          subImages: newSubImages,
                        }));
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    subImages: [...prev.subImages, ""],
                  }))
                }
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add another image
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            limit={300}
            placeholder="Detailed product description..."
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Pricing & Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Price *
            </label>
            <div className="relative">
              <input
                type="text"
                name="startingPrice"
                value={formData.startingPrice}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.startingPrice ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="100,000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ₫
              </span>
            </div>
            {errors.startingPrice && (
              <p className="mt-1 text-sm text-red-500">
                {errors.startingPrice}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step Price *
            </label>
            <div className="relative">
              <input
                type="text"
                name="stepPrice"
                value={formData.stepPrice}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.stepPrice ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="10,000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ₫
              </span>
            </div>
            {errors.stepPrice && (
              <p className="mt-1 text-sm text-red-500">{errors.stepPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buy Now Price (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                name="buyNowPrice"
                value={formData.buyNowPrice}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.buyNowPrice ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="110,000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ₫
              </span>
            </div>
            {errors.buyNowPrice && (
              <p className="mt-1 text-sm text-red-500">{errors.buyNowPrice}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.endTime ? "border-red-500" : "border-gray-300"
              } ${!formData.endTime ? "text-gray-500" : "text-gray-900"}`}
            />
            {errors.endTime && (
              <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
            )}
          </div>

          <div className="w-full md:w-1/2 flex items-center justify-evenly pt-6 pl-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="autoExtends"
                checked={formData.autoExtends}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto Extends</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="allowUnratedBidders"
                checked={formData.allowUnratedBidders}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Allow Unrated Bidders
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/seller/products")}
            className="px-6 py-2 mr-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              "Creating..."
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductForm;
