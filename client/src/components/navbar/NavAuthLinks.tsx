import { Link } from "react-router-dom";
import { useAuthStore } from "@stores/useAuthStore";

export default function NavbarAuthLinks() {
  const { user, logout } = useAuthStore();

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
          onClick={logout}
          className="hover:text-red-600 hover:font-semibold transition-all duration-200"
        >
          Logout
        </button>
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
