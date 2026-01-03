import React from "react";
import AdminProductsContainer from "@containers/admin/AdminProductsContainer";

const AdminActiveProductsPage: React.FC = () => {
  return <AdminProductsContainer status="active" />;
};

export default AdminActiveProductsPage;