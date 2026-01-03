import React from "react";
import AdminProductsContainer from "@containers/admin/AdminProductsContainer";

const AdminEndedProductsPage: React.FC = () => {
  return <AdminProductsContainer status="ended" />;
};

export default AdminEndedProductsPage;