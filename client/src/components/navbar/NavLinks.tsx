import { Link } from "react-router-dom";
import { useAuthStore } from "@stores/useAuthStore";

export default function NavbarLinks() {
  const { user } = useAuthStore();

  if (user) {
    return (
      <nav className="hidden md:flex items-center space-x-6 text-white text-xl">
        <Link
          to="/watchlist"
          className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
        >
          Watch list
        </Link>
        <Link
          to="/bidding"
          className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
        >
          Bidding
        </Link>
      </nav>
    );
  }

  return null;
}
