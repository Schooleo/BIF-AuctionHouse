import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminProductsContainer from "@containers/admin/AdminProductsContainer";

const AdminProductsPage: React.FC = () => {
  const { status } = useParams<{ status: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate status parameter
    if (status !== "active" && status !== "ended") {
      navigate("/admin/products/active", { replace: true });
    }
  }, [status, navigate]);

  if (status !== "active" && status !== "ended") {
    return null;
  }

  return <AdminProductsContainer status={status as "active" | "ended"} />;
};

export default AdminProductsPage;
