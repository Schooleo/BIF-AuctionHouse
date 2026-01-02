import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User, List, PlusCircle, Gavel, LogOut, ArrowRightLeft } from "lucide-react";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import { useAuthStore } from "@stores/useAuthStore";
import type { User as UserType } from "@interfaces/auth";

interface SellerDropdownProps {
  user: UserType;
}

export default function SellerDropdown({ user }: SellerDropdownProps) {
  const navigate = useNavigate();
  const { switchAccount } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
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

  const handleSwitchAccount = async () => {
    try {
      setIsSwitching(true);
      await switchAccount();
      setIsDropdownOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Failed to switch account:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      className="hidden md:flex items-center space-x-6 text-white text-xl"
      ref={dropdownRef}
    >
      <Link
        to="/seller/profile"
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
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-2 z-50 animate-slide-down">
            <Link
              to="/seller/profile?tab=info"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-primary-blue hover:text-white transition-colors duration-200 text-base"
            >
              <User size={18} />
              <span>Profile</span>
            </Link>
            <Link
              to="/seller/products"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-primary-blue hover:text-white transition-colors duration-200 text-base"
            >
              <List size={18} />
              <span>Current Products</span>
            </Link>
            <Link
              to="/seller/add-product"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-primary-blue hover:text-white transition-colors duration-200 text-base"
            >
              <PlusCircle size={18} />
              <span>Add Product</span>
            </Link>
            <Link
              to="/seller/bid-winners"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-primary-blue hover:text-white transition-colors duration-200 text-base"
            >
              <Gavel size={18} />
              <span>Bid Winners</span>
            </Link>
            {user.isUpgradedAccount && (
              <>
                <hr className="my-2 border-gray-200" />
                <button
                  onClick={handleSwitchAccount}
                  disabled={isSwitching}
                  className="flex items-center gap-3 px-4 py-2.5 text-primary-blue hover:bg-primary-blue hover:text-white transition-colors duration-200 w-full text-left text-base disabled:opacity-50"
                >
                  <ArrowRightLeft size={18} />
                  <span>{isSwitching ? "Switching..." : "Switch to Bidder"}</span>
                </button>
              </>
            )}
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
