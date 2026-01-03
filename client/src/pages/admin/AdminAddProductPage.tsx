import React from "react";
import AdminAddProductForm from "../../components/admin/AdminAddProductForm";

const AdminAddProductPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new auction product and assign it to a seller
        </p>
      </div>
      <AdminAddProductForm />
    </div>
  );
};

export default AdminAddProductPage;