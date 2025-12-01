import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@stores/useAuthStore";

const LogoutPage = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
    </div>
  );
};

export default LogoutPage;
