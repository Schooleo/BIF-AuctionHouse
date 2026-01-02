import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User, Star, Trophy, LogOut } from "lucide-react";
import { useAuthStore } from "@stores/useAuthStore";
import ConfirmationModal from "@components/ui/ConfirmationModal";

export default function NavbarAuthLinks() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    navigate("/auth/logout");
  };

  if (user) {
    // Đã có người dùng đăng nhập
    if (user.role === "bidder") {
      return (
        <div
          className="hidden md:flex items-center space-x-6 text-white text-xl"
          ref={dropdownRef}
        >
          <Link
            to="/profile?tab=info"
            className="hover:text-primary-yellow hover:scale-110 transition-all duration-200"
          >
            {user.name}
          </Link>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="hover:text-primary-yellow transition-all duration-200"
            >
              <Menu size={28} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 animate-slide-down">
                <Link
                  to="/profile?tab=info"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-primary-blue hover:text-white transition-colors duration-200 text-base"
                >
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/profile?tab=ratings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-primary-blue hover:text-white transition-colors duration-200 text-base"
                >
                  <Star size={18} />
                  <span>Ratings</span>
                </Link>
                <Link
                  to="/profile?tab=won"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-primary-blue hover:text-white transition-colors duration-200 text-base"
                >
                  <Trophy size={18} />
                  <span>Won Auctions</span>
                </Link>
                <hr className="my-2 border-gray-200" />
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left text-base"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>

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

    // Seller hoặc Admin
    const profileLink =
      user.role === "seller"
        ? "/seller/profile"
        : user.role === "admin"
          ? "/admin/profile"
          : "/profile";

    return (
      <div className="hidden md:flex items-center space-x-8 text-white text-xl">
        <Link
          to={profileLink}
          className="hover:text-primary-yellow hover:scale-110 transition-all duration-200"
        >
          {user.name}
        </Link>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="hover:text-red-600 hover:scale-110 transition-all duration-200"
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
        className="hover:text-primary-yellow hover:scale-110 transition-all duration-200"
      >
        Sign Up
      </Link>
      <div className="h-6 w-px bg-white" />
      <Link
        to="/auth/login"
        className="hover:text-primary-yellow hover:scale-110 transition-all duration-200"
      >
        Login
      </Link>
    </div>
  );
}
