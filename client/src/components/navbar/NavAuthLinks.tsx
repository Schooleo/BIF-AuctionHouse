import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@stores/useAuthStore";
import ConfirmationModal from "@components/ui/ConfirmationModal";

export default function NavbarAuthLinks() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    navigate("/auth/logout");
  };

  if (user) {
    // Đã có người dùng đăng nhập
    return (
      <div className="hidden md:flex items-center space-x-6 text-white text-xl">
        <Link
          to="/notifications"
          className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
        >
          Notifications
        </Link>
        <Link
          to="/profile"
          className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
        >
          {user.name}
        </Link>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="hover:text-red-600 hover:font-semibold transition-all duration-200"
        >
          Logout
        </button>

        <ConfirmationModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          confirmText="Logout"
          type="danger"
        />
      </div>
    );
  }

  // Không có người dùng đăng nhập
  return (
    <div className="hidden md:flex items-center space-x-6 text-white text-xl">
      <Link
        to="/auth/register"
        className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
      >
        Sign Up
      </Link>
      <div className="h-6 w-px bg-white" />
      <Link
        to="/auth/login"
        className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
      >
        Login
      </Link>
    </div>
  );
}
