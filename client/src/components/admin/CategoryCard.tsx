import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Ban,
  FolderOpen,
  Dot,
} from "lucide-react";
import { type CategoryWithStats } from "../../services/admin.api";
import { useAlertStore } from "../../stores/useAlertStore";

interface CategoryCardProps {
  category: CategoryWithStats;
  onEdit: (category: CategoryWithStats) => void;
  onDelete: (category: CategoryWithStats) => void;
  defaultExpanded?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Sub-category Card Component (Internal)
  const SubCategoryCard = ({ sub }: { sub: CategoryWithStats }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg mb-2 last:mb-0 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 shrink-0">
          {sub.representativeImage ? (
            <img
              src={sub.representativeImage}
              alt={sub.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary-blue" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-800">{sub.name}</h4>
            <div className="flex items-center gap-1.5">
              <Dot className="h-4 w-4" />
              <span className="text-xs text-gray-700">
                <span className="font-bold">{sub.productCount}</span> products
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5">
            <span>Created: {new Date(sub.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(sub.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(sub);
          }}
          className="p-2.5 bg-gray-50 text-gray-500 border border-gray-200 hover:text-primary-blue hover:bg-emerald-50 hover:border-emerald-50 rounded-full transition-colors"
          title="Update Sub-category"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (sub.productCount > 0) {
              addAlert(
                "warning",
                "You can't delete a category with existing products!"
              );
              return;
            }
            onDelete(sub);
          }}
          className={`p-2.5 bg-gray-50 border border-gray-200 rounded-full transition-colors text-gray-500${
            sub.productCount > 0
              ? "hover:text-gray-700 hover:bg-gray-200 cursor-not-allowed opacity-50"
              : " hover:text-red-600 hover:bg-red-50 hover:border-red-50"
          }`}
          title={
            sub.productCount > 0
              ? "Cannot delete: Has products"
              : "Delete Sub-category"
          }
        >
          {sub.productCount > 0 ? (
            <Ban className="w-4 h-4" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  const { addAlert } = useAlertStore();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Main Category Header */}
      <div
        onClick={toggleExpand}
        className="p-5 flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-5">
          {/* Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm border border-gray-100">
            {category.representativeImage ? (
              <img
                src={category.representativeImage}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-blue flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-primary-blue transition-colors">
              {category.name}
            </h3>
            <div className="flex items-center justify-between min-w-40 gap-4 text-sm text-gray-500 mt-1">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${category.productCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
              >
                <span className="font-bold">{category.productCount}</span>{" "}
                products
              </span>
              <span className="w-px h-4 rounded-lg bg-gray-400"></span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                {category.children.length} sub-categories
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 pl-1 mt-1.5">
              <span>
                Created: {new Date(category.createdAt).toLocaleDateString()}
              </span>
              <span>
                Updated: {new Date(category.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions & Expand Icon */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100 mr-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              className="p-2 text-gray-500 hover:text-primary-blue hover:bg-white rounded-full transition-all shadow-sm"
              title="Update Category"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (category.productCount > 0) {
                  addAlert(
                    "warning",
                    "You can't delete a category with existing products!"
                  );
                  return;
                }
                onDelete(category);
              }}
              className={`p-2 rounded-full transition-all shadow-sm text-gray-500 hover:bg-white ${
                category.productCount > 0
                  ? "hover:text-gray-700 cursor-not-allowed opacity-50"
                  : "hover:text-red-600"
              }`}
              title={
                category.productCount > 0
                  ? "Cannot delete: Has products"
                  : "Delete Category"
              }
            >
              {category.productCount > 0 ? (
                <Ban className="w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-primary-blue" />
          )}
        </div>
      </div>

      {/* Sub-categories Dropdown */}
      {isExpanded && (
        <div className="bg-gray-50/50 p-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-1">
            Sub-categories
          </h4>
          <div className="space-y-2">
            {category.children.length > 0 ? (
              category.children.map((child) => (
                <SubCategoryCard key={child._id} sub={child} />
              ))
            ) : (
              <p className="text-sm text-gray-400 italic ml-1">
                No sub-categories yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCard;
