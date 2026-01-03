import React from "react";
import { useParams } from "react-router-dom";
import AdminProductDetailsContainer from "@containers/admin/AdminProductDetailsContainer";

const AdminProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Product ID is required</p>
      </div>
    );
  }

  return <AdminProductDetailsContainer id={id} />;
};

export default AdminProductDetailsPage;