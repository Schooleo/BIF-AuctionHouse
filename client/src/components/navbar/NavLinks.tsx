import { Link } from "react-router-dom";
import { useAuthStore } from "@stores/useAuthStore";

export default function NavbarLinks() {
  const { user } = useAuthStore();

  if (user && user.role !== "seller" && user.role !== "admin") {
    return (
      <nav className="hidden md:flex items-center space-x-8 text-white text-xl">
        <Link
          to="/watchlist"
          className="hover:text-primary-yellow hover:scale-110 transition-all duration-200"
        >
          Watch list
        </Link>
        <Link
          to="/bidding"
          className="hover:text-primary-yellow hover:scale-110 transition-all duration-200"
        >
          Bidding
        </Link>
      </nav>
    );
  }

  return null;
}
