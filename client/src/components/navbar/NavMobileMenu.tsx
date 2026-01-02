import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAlertStore } from "@stores/useAlertStore";
import { User, Star, Trophy, LogOut } from "lucide-react";
import { useAuthStore } from "@stores/useAuthStore";
import ConfirmationModal from "@components/ui/ConfirmationModal";

interface Props {
  closeMenu: () => void;
}

export default function NavbarMobileMenu({ closeMenu }: Props) {
  const { user, logout, switchAccount } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const { addAlert } = useAlertStore();

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  const handleSwitchAccount = async () => {
    try {
      await switchAccount();
      setShowSwitchModal(false);
      closeMenu();

      // Redirect based on new role
      const newRole = useAuthStore.getState().user?.role;
      if (newRole === "bidder") {
        navigate("/");
      } else if (newRole === "seller") {
        navigate("/seller/products");
      }

      addAlert("success", "Account switched successfully");
    } catch (error) {
      addAlert("error", "Failed to switch account");
    }
  };

  const canSwitchAccount = user?.isUpgradedAccount && user?.linkedAccountId;
  const switchToRole = user?.role === "bidder" ? "seller" : "bidder";

  return (
    <div className="md:hidden absolute top-full left-0 w-full bg-primary-blue shadow-lg py-4 z-50 animate-slide-down">
      <nav className="flex flex-col items-center space-y-4 text-white text-lg">
        <Link to="/watchlist" onClick={closeMenu} className="hover:text-primary-yellow transition-colors duration-200">
          Watch list
        </Link>
        <Link to="/bidding" onClick={closeMenu} className="hover:text-primary-yellow transition-colors duration-200">
          Bidding
        </Link>

        {user ? (
          <>
            {user.role === "bidder" ? (
              <>
                <Link
                  to="/profile?tab=info"
                  onClick={closeMenu}
                  className="flex items-center gap-2 hover:text-primary-yellow transition-all duration-200"
                >
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/profile?tab=ratings"
                  onClick={closeMenu}
                  className="flex items-center gap-2 hover:text-primary-yellow transition-all duration-200"
                >
                  <Star size={18} />
                  <span>Ratings</span>
                </Link>
                <Link
                  to="/profile?tab=won"
                  onClick={closeMenu}
                  className="flex items-center gap-2 hover:text-primary-yellow transition-all duration-200"
                >
                  <Trophy size={18} />
                  <span>Won Auctions</span>
                </Link>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center gap-2 hover:text-red-500 transition-all duration-200"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to={user.role === "seller" ? "/seller/products" : "/profile"}
                  onClick={closeMenu}
                  className="hover:text-primary-yellow transition-all duration-200"
                >
                  {user.name}
                </Link>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="hover:text-red-500 transition-all duration-200"
                >
                  Logout
                </button>
              </>
            )}
            <ConfirmationModal
              isOpen={showLogoutModal}
              onClose={() => setShowLogoutModal(false)}
              onConfirm={handleLogout}
              title="Confirm Logout"
              message="Are you sure you want to log out?"
              confirmText="Logout"
              type="danger"
            />

            {canSwitchAccount && (
              <ConfirmationModal
                isOpen={showSwitchModal}
                onClose={() => setShowSwitchModal(false)}
                onConfirm={handleSwitchAccount}
                title="Switch Account"
                message={`Are you sure you want to switch to your ${switchToRole} account?`}
                confirmText="Switch"
                type="info"
              />
            )}
          </>
        ) : (
          <>
            <Link
              to="/auth/register"
              onClick={closeMenu}
              className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
            >
              Sign Up
            </Link>
            <div className="w-24 h-px bg-white my-2" />
            <Link
              to="/auth/login"
              onClick={closeMenu}
              className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
            >
              Login
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
