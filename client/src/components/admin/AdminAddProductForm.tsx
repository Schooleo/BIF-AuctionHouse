import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@services/admin.api";
import { productApi } from "@services/product.api";
import type { Category } from "@interfaces/product";
import { Plus, X } from "lucide-react";
import { useAlertStore } from "@stores/useAlertStore";
import RichTextEditor from "@components/shared/RichTextEditor";
import ImageUpload from "@components/shared/ImageUpload";
import { z } from "zod";

const NAME_REGEX = /^[a-zA-Z0-9\s,.\-]+$/;
const URL_REGEX = /(https?:\/\/|www\.)/gi;
const SPECIAL_CHARS_REGEX = /[!@$%^&*()_+=\[\]{};':"\\|<>?]/;

const productSchema = z
  .object({
    name: z
      .string()
      .min(1, "Product name is required")
      .max(100, "Name must be less than 100 characters")
      .refine(
        (val) => NAME_REGEX.test(val),
        "Name can only contain letters, numbers, spaces, and basic punctuation (comma, period, hyphen)"
      )
      .refine(
        (val) => !SPECIAL_CHARS_REGEX.test(val),
        "Name cannot contain special characters like ! @ $ % ^ & *"
      ),
    category: z.string().min(1, "Category is required"),
    sellerId: z.string().min(1, "Seller is required"),
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
          path: [],
        });
      }
    }),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(3000, "Description must be less than 3000 characters")
      .refine(
        (val) => !URL_REGEX.test(val),
        "Description cannot contain URLs or hyperlinks"
      ),
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
      .transform((val) => (val ? Number(val.replace(/,/g, "")) : undefined)),
    endTime: z.string().min(1, "End time is required"),
    autoExtends: z.boolean().optional(),
    allowUnratedBidders: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.buyNowPrice) {
        const minBuyNow = data.startingPrice + data.stepPrice;
        return data.buyNowPrice >= minBuyNow;
      }
      return true;
    },
    {
      message: "Buy Now price must be at least Starting Price + Step Price",
      path: ["buyNowPrice"],
    }
  );

type ProductFormErrors = {
  [key: string]: string;
};

interface SellerOption {
  _id: string;
  name: string;
  email: string;
}

const AdminAddProductForm: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const addAlert = useAlertStore((state) => state.addAlert);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sellerId: "",
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
    const fetchInitialData = async () => {
      try {
        const [categoriesData, sellersData] = await Promise.all([
          productApi.fetchCategories(),
          adminApi.getSellers(),
        ]);
        setCategories(categoriesData);
        setSellers(sellersData);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        addAlert("error", "Failed to load categories or sellers");
      }
    };
    fetchInitialData();
  }, [addAlert]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

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

      await adminApi.createProduct(payload);
      addAlert("success", "Product created successfully!");
      navigate("/admin/products/active");
    } catch (error) {
      const message = (error as Error).message || "Failed to create product";
      setSubmitError(message);
      addAlert("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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

        {/* Seller Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign to Seller *
          </label>
          <select
            name="sellerId"
            value={formData.sellerId}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.sellerId ? "border-red-500" : "border-gray-300"
            } ${!formData.sellerId ? "text-gray-500" : "text-gray-900"}`}
          >
            <option value="">Select a seller</option>
            {sellers.map((seller) => (
              <option
                key={seller._id}
                value={seller._id}
                className="text-gray-900"
              >
                {seller.name} ({seller.email})
              </option>
            ))}
          </select>
          {errors.sellerId && (
            <p className="mt-1 text-sm text-red-500">{errors.sellerId}</p>
          )}
        </div>

        {/* Categories */}
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
                <option
                  key={cat._id}
                  value={cat._id}
                  className="text-gray-900"
                >
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
              Main Image *
            </label>
            <ImageUpload
              value={formData.mainImage}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, mainImage: url }))
              }
              onRemove={() =>
                setFormData((prev) => ({ ...prev, mainImage: "" }))
              }
              className={
                errors.mainImage ? "border-red-500 rounded-lg p-1 border" : ""
              }
              placeholder="Upload main product image"
              height="h-64"
            />
            {errors.mainImage && (
              <p className="mt-1 text-sm text-red-500">{errors.mainImage}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub Images (Min 3) *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.subImages.map((img, index) => (
                <div key={index} className="relative">
                  <ImageUpload
                    value={img}
                    onChange={(url) => handleSubImageChange(index, url)}
                    onRemove={() => {
                      if (formData.subImages.length > 3) {
                        const newSubImages = formData.subImages.filter(
                          (_, i) => i !== index
                        );
                        setFormData((prev) => ({
                          ...prev,
                          subImages: newSubImages,
                        }));
                      } else {
                        handleSubImageChange(index, "");
                      }
                    }}
                    className={
                      errors[`subImages.${index}`]
                        ? "border-red-500 rounded-lg border"
                        : ""
                    }
                    placeholder={`Sub image ${index + 1}`}
                    height="h-32"
                  />
                  {formData.subImages.length > 3 && (
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
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-200"
                      title="Remove slot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {errors[`subImages.${index}`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[`subImages.${index}`]}
                    </p>
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
                className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">Add Image</span>
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
            limit={3000}
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
            <input
              type="text"
              name="startingPrice"
              value={formData.startingPrice}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.startingPrice ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="100,000"
            />
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
            <input
              type="text"
              name="stepPrice"
              value={formData.stepPrice}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.stepPrice ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="10,000"
            />
            {errors.stepPrice && (
              <p className="mt-1 text-sm text-red-500">{errors.stepPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buy Now Price
            </label>
            <input
              type="text"
              name="buyNowPrice"
              value={formData.buyNowPrice}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.buyNowPrice ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Optional"
            />
            {errors.buyNowPrice && (
              <p className="mt-1 text-sm text-red-500">{errors.buyNowPrice}</p>
            )}
          </div>
        </div>

        <div>
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
            }`}
          />
          {errors.endTime && (
            <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="autoExtends"
                checked={formData.autoExtends}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Auto-extend on late bids
              </span>
            </label>
          </div>

          <div className="flex items-center">
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
            onClick={() => navigate("/admin/products/active")}
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

export default AdminAddProductForm;