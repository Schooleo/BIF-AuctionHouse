import React, { useState, useEffect } from "react";
import type { Category } from "@interfaces/product";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import PriceRangeFilter from "./PriceRangeFilter";
import { ChevronDown, ChevronRight, X } from "lucide-react";

interface SideBarCategoryProps {
  categories: Category[];
  title?: string;
}

const MIN_PRICE = 0;
const MAX_PRICE = 100000000; // 100 million VND generic max

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

  // Sync with URL
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) {
      setSelectedCategories(catParam.split(","));
    } else {
      setSelectedCategories([]);
    }

    const minParam = searchParams.get("min_price");
    const maxParam = searchParams.get("max_price");

    setPriceRange([
      minParam ? Number(minParam) : MIN_PRICE,
      maxParam ? Number(maxParam) : MAX_PRICE,
    ]);
  }, [searchParams]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const toggleExpand = (catId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
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
      <ul className={`space-y-1 ${depth > 0 ? "ml-4 border-l pl-2" : ""}`}>
        {cats.map((cat) => {
          const isExpanded = expandedCategories.includes(cat._id);
          const hasChildren = cat.children && cat.children.length > 0;
          const isSelected = selectedCategories.includes(cat._id);

          return (
            <li key={cat._id}>
              <div className="flex items-center justify-between py-1 group">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryChange(cat._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span
                    className={`text-sm ${
                      isSelected
                        ? "font-medium text-blue-700"
                        : "text-gray-700 group-hover:text-blue-600 cursor-pointer"
                    }`}
                    onClick={() => handleCategoryChange(cat._id)}
                  >
                    {cat.name}
                  </span>
                </div>

                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(cat._id)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                )}
              </div>
              {hasChildren && isExpanded && renderCategories(cat.children!, depth + 1)}
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
    <aside className="w-full bg-white shadow-md rounded-lg border flex flex-col h-fit">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
          >
            Reset <X size={12} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Category</h3>
          {renderCategories(categories)}
        </div>

        <hr className="border-gray-100" />

        <PriceRangeFilter
          min={MIN_PRICE}
          max={MAX_PRICE}
          value={priceRange}
          onChange={setPriceRange}
        />

        <button
          onClick={handleApply}
          className="w-full text-white py-2 rounded-md transition font-medium text-sm shadow-sm hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary-blue)" }}
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
};

export default SideBarCategory;
