import React, { useState, useEffect, useCallback } from "react";
import type { Category } from "@interfaces/product";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import PriceRangeFilter from "./PriceRangeFilter";
import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import ActiveFilters from "./ActiveFilters";
import classNames from "classnames";

interface SideBarCategoryProps {
  categories: Category[];
  title?: string;
}

const MIN_PRICE = 0;
const MAX_PRICE = 500000000; // 500 million VND generic max

const SideBarCategory: React.FC<SideBarCategoryProps> = ({
  categories,
  title = "Filters",
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    MIN_PRICE,
    MAX_PRICE,
  ]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  /* Helper to find parent of a category */
  const findParentCategory = useCallback(
    (catId: string): string | null => {
      for (const cat of categories) {
        if (cat.children?.some((c) => c._id === catId)) {
          return cat._id;
        }
      }
      return null;
    },
    [categories]
  );

  // Sync with URL and auto-expand
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) {
      const ids = catParam.split(",");
      setSelectedCategories(ids);

      // Auto-expand parent if a sub-category is selected
      if (ids.length > 0) {
        const parentId = findParentCategory(ids[0]);
        if (parentId) {
          setExpandedCategories([parentId]);
        }
      }
    } else {
      setSelectedCategories([]);
      setExpandedCategories([]);
    }

    const minParam = searchParams.get("min_price");
    const maxParam = searchParams.get("max_price");

    setPriceRange([
      minParam ? Number(minParam) : MIN_PRICE,
      maxParam ? Number(maxParam) : MAX_PRICE,
    ]);
  }, [searchParams, categories, findParentCategory]); // Added findParentCategory dependency

  const handleCategoryChange = (catId: string) => {
    let newSelection: string[] = [];

    setSelectedCategories((prev) => {
      // Single selection logic
      if (prev.includes(catId)) {
        newSelection = [];
        return [];
      } else {
        newSelection = [catId];
        return [catId];
      }
    });

    // Handle Expansion based on Selection
    if (newSelection.length > 0) {
      // We just selected something new
      const parentId = findParentCategory(catId);
      if (parentId) {
        // It's a child, expand parent
        setExpandedCategories([parentId]);
      } else {
        // It's a root, collapse others (single expansion)
        setExpandedCategories([]);
      }
    }
  };

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(
      (prev) =>
        prev.includes(catId)
          ? [] // Collapse if already open
          : [catId] // Open only this one
    );
  };

  const applyFilters = (newParams: URLSearchParams) => {
    // Reset page to 1 on filter change
    newParams.set("page", "1");

    if (location.pathname !== "/products") {
      navigate({ pathname: "/products", search: newParams.toString() });
    } else {
      setSearchParams(newParams);
    }
  };

  const handleApply = () => {
    const newParams = new URLSearchParams(searchParams);

    // Update Category
    if (selectedCategories.length > 0) {
      newParams.set("category", selectedCategories.join(","));
    } else {
      newParams.delete("category");
    }

    // Update Price
    if (priceRange[0] > MIN_PRICE) {
      newParams.set("min_price", priceRange[0].toString());
    } else {
      newParams.delete("min_price");
    }

    if (priceRange[1] < MAX_PRICE) {
      newParams.set("max_price", priceRange[1].toString());
    } else {
      newParams.delete("max_price");
    }

    applyFilters(newParams);
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setExpandedCategories([]); // Reset expanded categories on reset
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("category");
    newParams.delete("min_price");
    newParams.delete("max_price");
    newParams.set("page", "1");
    // Also use apply logic to ensure redirect if needed (though unlikely for reset on home)
    applyFilters(newParams);
  };

  const renderCategories = (cats: Category[], depth = 0) => {
    return (
      <ul
        className={`space-y-1 ${depth > 0 ? "ml-4 border-l-2 border-gray-100 pl-2" : ""}`}
      >
        {cats.map((cat) => {
          const isExpanded = expandedCategories.includes(cat._id);
          const hasChildren = cat.children && cat.children.length > 0;
          const isSelected = selectedCategories.includes(cat._id);

          return (
            <li key={cat._id}>
              <div
                className={classNames(
                  "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 group",
                  {
                    "bg-blue-50 text-blue-700": isSelected,
                    "hover:bg-gray-100 text-gray-700": !isSelected,
                  }
                )}
                onClick={() => handleCategoryChange(cat._id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryChange(cat._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>

                {hasChildren && (
                  <button
                    onClick={(e) => toggleExpand(cat._id, e)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                )}
              </div>
              {hasChildren &&
                isExpanded &&
                renderCategories(cat.children!, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange[0] > MIN_PRICE ||
    priceRange[1] < MAX_PRICE;

  return (
    // Updated wrapper: removed bg-white, border, min-h. Just layout.
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary-blue" />
          <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">
            {title}
          </h2>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 hover:underline"
          >
            Reset <X size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6">
        {hasActiveFilters && (
          <div className="mb-2">
            <ActiveFilters categories={categories} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Category
          </h3>
          {renderCategories(categories)}
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Price Range
          </h3>
          <PriceRangeFilter
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={priceRange}
            onChange={setPriceRange}
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleApply}
            className="w-full bg-primary-blue text-white py-2.5 rounded-lg transition-all font-medium text-sm shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.98]"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideBarCategory;
