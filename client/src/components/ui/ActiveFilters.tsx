import React from "react";
import { useSearchParams } from "react-router-dom";
import type { Category } from "@interfaces/product";
import { X } from "lucide-react";
import { formatPrice } from "@utils/product";

interface ActiveFiltersProps {
  categories: Category[];
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ categories }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCatIds = searchParams.get("category")?.split(",") || [];
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");

  // Helper to flatten categories for lookup
  const getAllCategories = (cats: Category[]): Category[] => {
    let all: Category[] = [];
    cats.forEach((c) => {
      all.push(c);
      if (c.children) all = [...all, ...getAllCategories(c.children)];
    });
    return all;
  };

  const allCats = getAllCategories(categories);

  const removeCategory = (id: string) => {
    const newCats = selectedCatIds.filter((cid) => cid !== id);
    const newParams = new URLSearchParams(searchParams);
    if (newCats.length > 0) {
      newParams.set("category", newCats.join(","));
    } else {
      newParams.delete("category");
    }
    // Reset page
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const removePrice = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("min_price");
    newParams.delete("max_price");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  if (selectedCatIds.length === 0 && !minPrice && !maxPrice) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {selectedCatIds.map((id) => {
        const cat = allCats.find((c) => c._id === id);
        if (!cat) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {cat.name}
            <button
              onClick={() => removeCategory(id)}
              className="ml-2 hover:text-blue-900"
            >
              <X size={12} />
            </button>
          </span>
        );
      })}

      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Price: {minPrice ? formatPrice(Number(minPrice)) : "0"} -{" "}
          {maxPrice ? formatPrice(Number(maxPrice)) : "Any"}
          <button onClick={removePrice} className="ml-2 hover:text-green-900">
            <X size={12} />
          </button>
        </span>
      )}
    </div>
  );
};

export default ActiveFilters;
