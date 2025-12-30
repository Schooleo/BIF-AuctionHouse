import React, { useRef } from "react";
import { Plus } from "lucide-react";
import AdminCategoriesContainer, {
  type AdminCategoriesContainerRef,
} from "../../containers/admin/AdminCategoriesContainer";

const AdminCategoriesPage: React.FC = () => {
  const containerRef = useRef<AdminCategoriesContainerRef>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Categories Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product categories, sub-categories, and view statistics.
          </p>
        </div>

        <button
          onClick={() => containerRef.current?.openAddModal()}
          className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2.5 rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-in-out font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-2.5 py-4">
        <AdminCategoriesContainer ref={containerRef} />
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
