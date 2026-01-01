import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@stores/useAuthStore";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();
  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user is banned and restrict access
  if (user.status === "BLOCKED") {
    const allowedPaths = ["/banned", "/unban-request", "/auth/logout"];
    if (!allowedPaths.includes(location.pathname)) {
      return <Navigate to="/banned" replace />;
    }
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
