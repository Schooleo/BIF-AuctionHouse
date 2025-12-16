import React from "react";
import { useParams } from "react-router-dom";

const AdminCategoryDetailsPage: React.FC = () => {
  const { id } = useParams();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Category Details {id && `- ${id}`}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <p className="text-gray-500">To be implemented...</p>
      </div>
    </div>
  );
};

export default AdminCategoryDetailsPage;
