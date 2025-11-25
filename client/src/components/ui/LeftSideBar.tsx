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

  const toggleCategory = (categoryId: string) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  return (
    <aside className="w-full bg-white shadow-md rounded-lg p-4 border">
      <Link to="/products" className="block mb-3">
        <h2 className="text-lg font-semibold text-gray-800 hover:text-primary-blue transition-colors">
          {title}
        </h2>
      </Link>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat._id}>
            <div className="w-full flex justify-between items-center px-3 py-2 rounded-md hover:bg-gray-100 transition">
              <Link
                to={`/products?category=${cat._id}`}
                className="flex-1 text-gray-700 font-medium text-left"
              >
                {cat.name}
              </Link>
              
              {cat.children && cat.children.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleCategory(cat._id);
                  }}
                  className="px-2 text-gray-500 font-bold hover:text-gray-800"
                >
                  {openCategory === cat._id ? "−" : "+"}
                </button>
              )}
            </div>

            {openCategory === cat._id && cat.children && (
              <ul className="ml-4 mt-2 space-y-1 border-l pl-3">
                {cat.children.map((sub) => (
                  <li key={sub._id}>
                    <Link
                      to={`/products?category=${sub._id}`}
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
