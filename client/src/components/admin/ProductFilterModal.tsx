import React, { useState, useEffect } from "react";
import { X, DollarSign, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { productApi } from "@services/product.api";
import type { Category } from "@interfaces/product";
import { formatPrice } from "@utils/product";

interface ProductFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: {
    categories: Category[];
    minPrice?: number;
    maxPrice?: number;
  }) => void;
  currentFilters: {
    categories: Category[];
    minPrice?: number;
    maxPrice?: number;
  };
}

const ProductFilterModal: React.FC<ProductFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    currentFilters.categories
  );
  const [minPrice, setMinPrice] = useState<string>(
    currentFilters.minPrice?.toString() || ""
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    currentFilters.maxPrice?.toString() || ""
  );
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setSelectedCategories(currentFilters.categories);
      setMinPrice(currentFilters.minPrice?.toString() || "");
      setMaxPrice(currentFilters.maxPrice?.toString() || "");
    }
  }, [isOpen, currentFilters]);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const data = await productApi.fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.some((c) => c._id === category._id);
      return isSelected
        ? prev.filter((c) => c._id !== category._id)
        : [...prev, category];
    });
  };

  const toggleExpand = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApply = () => {
    const filters: {
      categories: Category[];
      minPrice?: number;
      maxPrice?: number;
    } = {
      categories: selectedCategories,
    };

    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setMinPrice("");
    setMaxPrice("");
    setExpandedCategories([]);
  };

  const isInvalid =
    minPrice &&
    maxPrice &&
    parseFloat(minPrice) >= parseFloat(maxPrice);

  if (!isOpen) return null;

  const renderCategories = (cats: Category[], depth = 0) => {
    return cats.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedCategories.includes(cat._id);
      const isSelected = selectedCategories.some((c) => c._id === cat._id);

      return (
        <div key={cat._id} style={{ marginLeft: depth * 16 }}>
          <div className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded px-2 transition-colors">
            {hasChildren && (
              <button
                onClick={(e) => toggleExpand(cat._id, e)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            <label className="flex items-center gap-2 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue cursor-pointer"
              />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </label>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderCategories(cat.children!, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Filter Products</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Categories Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-primary-blue" />
              <h3 className="text-lg font-semibold text-gray-800">
                Categories
              </h3>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              {isLoadingCategories ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  Loading categories...
                </div>
              ) : categories.length > 0 ? (
                renderCategories(categories)
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No categories available
                </p>
              )}
            </div>
            {selectedCategories.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedCategories.length} categor
                {selectedCategories.length !== 1 ? "ies" : "y"} selected
              </p>
            )}
          </div>

          {/* Price Range Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-primary-blue" />
              <h3 className="text-lg font-semibold text-gray-800">
                Price Range
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="No limit"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
            </div>
            {isInvalid && (
              <p className="text-sm text-red-500 mt-2">
                Max price must be greater than min price
              </p>
            )}
            {minPrice && maxPrice && !isInvalid && (
              <p className="text-sm text-gray-600 mt-2">
                Price range: {formatPrice(parseFloat(minPrice))} -{" "}
                {formatPrice(parseFloat(maxPrice))}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reset All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isInvalid}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-blue rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilterModal;