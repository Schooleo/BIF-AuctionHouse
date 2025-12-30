import React, { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi, type CategoryWithStats } from "../../services/admin.api";
import CategoryCard from "../../components/admin/CategoryCard";
import { useAlertStore } from "../../stores/useAlertStore";
import PopUpWindow from "../../components/ui/PopUpWindow";
import ConfirmationModal from "../../components/ui/ConfirmationModal";

export interface AdminCategoriesContainerRef {
  openAddModal: () => void;
}

export default React.forwardRef<AdminCategoriesContainerRef, unknown>(
  function AdminCategoriesContainer(props, ref) {
    void props;
    const { addAlert } = useAlertStore();
    const [categories, setCategories] = useState<CategoryWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 8;

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] =
      useState<CategoryWithStats | null>(null);

    // Confirmation Modal
    const [confirmModal, setConfirmModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
    }>({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
    });

    // Form State
    const [categoryName, setCategoryName] = useState("");
    const [subCategoryCount, setSubCategoryCount] = useState(0);
    const [subCategories, setSubCategories] = useState<string[]>([]);

    // Filter & Sort State
    const [filter, setFilter] = useState("default");
    const [sort, setSort] = useState("newest");

    // Derived State (Client-side logic applied to current page)
    const filteredCategories = React.useMemo(() => {
      let result = [...categories];

      // 1. Filter
      if (filter === "empty") {
        result = result.filter((root) => {
          const rootIsEmpty = root.productCount === 0;
          const hasEmptyChild = root.children.some((c) => c.productCount === 0);
          return rootIsEmpty || hasEmptyChild;
        });
      }

      // 2. Sort
      result.sort((a, b) => {
        if (sort === "newest")
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        if (sort === "oldest")
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        if (sort === "most_products") return b.productCount - a.productCount;
        if (sort === "least_products") return a.productCount - b.productCount;
        return 0;
      });

      return result;
    }, [categories, filter, sort]);

    React.useImperativeHandle(ref, () => ({
      openAddModal: () => {
        setEditingCategory(null);
        setCategoryName("");
        setSubCategoryCount(0);
        setSubCategories([]);
        setIsModalOpen(true);
      },
    }));

    // Fetch Data
    const fetchCategories = React.useCallback(async () => {
      setIsLoading(true);
      try {
        const resp = await adminApi.getCategories(page, limit);

        // Handle both array (legacy/all) and paginated response
        if ("categories" in resp) {
          setCategories(resp.categories);
          setTotalPages(resp.totalPages);
        } else {
          setCategories(resp);
          setTotalPages(1);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(error.message);
        }
        addAlert("error", "Failed to fetch categories");
      } finally {
        setIsLoading(false);
      }
    }, [addAlert, page, limit]);

    useEffect(() => {
      fetchCategories();
    }, [fetchCategories]);

    const closeModal = () => {
      setIsModalOpen(false);
      setEditingCategory(null);
    };

    // Logic to handle Sub-category inputs
    useEffect(() => {
      const currentLen = subCategories.length;
      if (subCategoryCount > currentLen) {
        const diff = subCategoryCount - currentLen;
        setSubCategories([...subCategories, ...Array(diff).fill("")]);
      } else if (subCategoryCount < currentLen) {
        setSubCategories(subCategories.slice(0, subCategoryCount));
      }
    }, [subCategoryCount, subCategories]);

    const handleSubCategoryChange = (index: number, value: string) => {
      const newSubs = [...subCategories];
      newSubs[index] = value;
      setSubCategories(newSubs);
    };

    const openEditModal = (cat: CategoryWithStats) => {
      setEditingCategory(cat);
      setCategoryName(cat.name);
      // Logic for editing sub-categories vs main
      // If main, reset new sub-cat inputs
      setSubCategoryCount(0);
      setSubCategories([]);
      setIsModalOpen(true);
    };

    const handleSubmit = async () => {
      // Removed e: FormEvent, PopUpWindow might not pass it directly if we use its onSubmit
      try {
        if (editingCategory) {
          const isSub = !!editingCategory.parent;
          const payload = {
            name: categoryName,
            subCategories: isSub
              ? undefined
              : subCategories.filter((s) => s.trim() !== ""),
          };
          await adminApi.updateCategory(editingCategory._id, payload);
          addAlert("success", "Category updated");
        } else {
          const payload = {
            name: categoryName,
            subCategories: subCategories.filter((s) => s.trim() !== ""),
          };
          await adminApi.createCategory(payload);
          addAlert("success", "Category created");
        }
        closeModal();
        fetchCategories();
      } catch (error) {
        console.error(error);
        addAlert("error", "Operation failed");
      }
    };

    const handleDelete = async (cat: CategoryWithStats) => {
      setConfirmModal({
        isOpen: true,
        title: "Delete Category",
        message: `Are you sure you want to delete "${cat.name}"? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await adminApi.deleteCategory(cat._id);
            fetchCategories();
            addAlert("success", "Category deleted");
          } catch (error: unknown) {
            if (error instanceof Error) {
              console.error(error.message);
            }
            addAlert("error", "Failed to delete. Check if it has products.");
          }
        },
      });
    };

    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
              >
                <option value="default">Default</option>
                <option value="empty">Empty Categories</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="most_products">Most Products</option>
                <option value="least_products">Least Products</option>
              </select>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-600 min-w-20 text-center">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-primary-blue" />
          </div>
        ) : (
          <>
            {/* Mobile View: Single Column */}
            <div className="block md:hidden space-y-4">
              {filteredCategories.map((c) => (
                <CategoryCard
                  key={c._id}
                  category={c}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  defaultExpanded={filter === "empty"}
                />
              ))}
            </div>

            {/* Desktop View: Two Independent Columns (Masonry-like) */}
            <div className="hidden md:flex gap-4 items-start">
              <div className="flex-1 space-y-4">
                {filteredCategories
                  .filter((_, i) => i % 2 === 0)
                  .map((c) => (
                    <CategoryCard
                      key={c._id}
                      category={c}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      defaultExpanded={filter === "empty"}
                    />
                  ))}
              </div>
              <div className="flex-1 space-y-4">
                {filteredCategories
                  .filter((_, i) => i % 2 !== 0)
                  .map((c) => (
                    <CategoryCard
                      key={c._id}
                      category={c}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      defaultExpanded={filter === "empty"}
                    />
                  ))}
              </div>
            </div>

            {filteredCategories.length === 0 && (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No categories found.
              </div>
            )}
          </>
        )}

        <PopUpWindow
          isOpen={isModalOpen}
          onClose={closeModal}
          title={
            editingCategory
              ? editingCategory.parent
                ? "Update Sub-Category"
                : "Update Category"
              : "Add New Category"
          }
          onSubmit={handleSubmit}
          submitText={editingCategory ? "Update" : "Create"}
          isLoading={false}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
                placeholder="e.g. Electronics"
                maxLength={30}
              />
            </div>

            {(!editingCategory || !editingCategory.parent) && (
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingCategory
                    ? "Add New Sub-categories"
                    : "Sub-categories"}
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-xs text-gray-500">Count:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSubCategoryCount(Math.max(0, subCategoryCount - 1))
                      }
                      className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-4 text-center text-sm font-medium">
                      {subCategoryCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubCategoryCount(subCategoryCount + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-primary-blue text-white hover:bg-blue-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {subCategories.map((sub, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={sub}
                      onChange={(e) =>
                        handleSubCategoryChange(idx, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-blue outline-none"
                      placeholder={`Sub-category ${idx + 1}`}
                      maxLength={30}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopUpWindow>

        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type="danger"
          confirmText="Delete"
        />
      </div>
    );
  }
);
