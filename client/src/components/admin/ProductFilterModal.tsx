import React, { useState, useEffect } from "react";
import { DollarSign, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { productApi } from "@services/product.api";
import type { Category } from "@interfaces/product";
import PopUpWindow from "@components/ui/PopUpWindow";
import PriceRangeFilter from "@components/ui/PriceRangeFilter";

const SLIDER_MAX = 500000000; // 500 million

interface ProductFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: {
    category?: Category;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
  currentFilters: {
    category?: Category;
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
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(currentFilters.category);

  // Price range state
  const [priceRange, setPriceRange] = useState<[number, number]>([
    currentFilters.minPrice || 0,
    currentFilters.maxPrice || SLIDER_MAX,
  ]);

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const fetchCategories = React.useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const data = await productApi.fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (categories.length === 0) {
        fetchCategories();
      }
      setSelectedCategory(currentFilters.category);
      setPriceRange([
        currentFilters.minPrice || 0,
        currentFilters.maxPrice || SLIDER_MAX,
      ]);
    }
  }, [
    isOpen,
    categories.length,
    fetchCategories,
    currentFilters.category,
    currentFilters.minPrice,
    currentFilters.maxPrice,
  ]);

  const handleSelectCategory = (category: Category) => {
    if (selectedCategory?._id === category._id) {
      setSelectedCategory(undefined); // Deselect if already selected
    } else {
      setSelectedCategory(category);
    }
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
      category?: Category;
      minPrice?: number;
      maxPrice?: number;
    } = {
      category: selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    };

    onApply(filters);
    onClose();
  };

  const renderCategories = (cats: Category[], depth = 0) => {
    return cats.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expandedCategories.includes(cat._id);
      const isSelected = selectedCategory?._id === cat._id;

      return (
        <div key={cat._id} style={{ marginLeft: depth * 16 }}>
          <div className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded px-2 transition-colors">
            {hasChildren && (
              <button
                type="button"
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
                type="radio"
                name="category"
                checked={isSelected}
                onChange={() => handleSelectCategory(cat)}
                className="w-4 h-4 border-gray-300 text-primary-blue focus:ring-primary-blue cursor-pointer"
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
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleApply}
      title="Filter Products"
      submitText="Apply Filters"
      size="lg"
      submitButtonColor="bg-primary-blue"
      hideFooter={false}
      isLoading={false}
    >
      <div className="space-y-6">
        {/* Categories Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-primary-blue" />
            <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
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
          {selectedCategory && (
            <p className="text-sm text-gray-600 mt-2">
              Selected:{" "}
              <span className="font-medium">{selectedCategory.name}</span>
            </p>
          )}
        </div>

        {/* Price Range Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-primary-blue" />
            <h3 className="text-lg font-semibold text-gray-800">Price Range</h3>
          </div>
          <PriceRangeFilter
            min={0}
            max={SLIDER_MAX}
            value={priceRange}
            onChange={setPriceRange}
          />
        </div>
      </div>
    </PopUpWindow>
  );
};

export default ProductFilterModal;
