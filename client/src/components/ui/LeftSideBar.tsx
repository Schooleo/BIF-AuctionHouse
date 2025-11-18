import React, { useState } from "react";
import type { Category } from "@interfaces/product";
import { Link } from "react-router-dom";

interface SideBarCategoryProps {
  categories: Category[];
  title?: string;
}

const SideBarCategory: React.FC<SideBarCategoryProps> = ({
  categories,
  title = "Categories",
}) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const mockSubCategories = (parentId: string) => {
    return [
      { _id: parentId + "-1", name: "Sub categories 1" },
      { _id: parentId + "-2", name: "Sub categories 2" },
    ];
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  return (
    <aside className="w-full bg-white shadow-md rounded-lg p-4 border">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat._id}>
            <button
              onClick={() => toggleCategory(cat._id)}
              className="w-full flex justify-between px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition"
            >
              {cat.name}
              <span>{openCategory === cat._id ? "−" : "+"}</span>
            </button>

            {openCategory === cat._id && (
              <ul className="ml-4 mt-2 space-y-1 border-l pl-3">
                {mockSubCategories(cat._id).map((sub) => (
                  <li key={sub._id}>
                    <Link
                      to={`/category/${sub._id}`}
                      className="block px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SideBarCategory;
