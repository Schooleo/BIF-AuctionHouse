import { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../forms/SearchBar";
import Logo from "./Logo";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary-blue shadow-md relative">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3">
        <Logo
          logoSizes={[12, 16, 20]}
          spanText="BIF - Auction House"
          className=""
        />

        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none focus:ring-2 focus:ring-primary-yellow p-2 rounded"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            )}
          </button>
        </div>

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

        <SearchBar placeholder="Search" className="mx-4 md:mx-0 max-w-md" />

        <div className="hidden md:flex items-center space-x-6 text-white text-xl">
          <Link
            to="/notifications"
            className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
          >
            Notifications
          </Link>
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
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-primary-blue shadow-lg py-4 z-50 animate-slide-down">
          <nav className="flex flex-col items-center space-y-4 text-white text-lg">
            <Link
              to="/"
              className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/watchlist"
              className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Watch list
            </Link>
            <Link
              to="/bidding"
              className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bidding
            </Link>
            <div className="w-full px-6 py-2">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 rounded-full border border-white text-white placeholder-gray-300 focus:outline-none focus:ring-white bg-secondary-blue"
              />
            </div>
            <Link
              to="/notifications"
              className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Notifications
            </Link>
            <Link
              to="/auth/register"
              className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
            <div className="w-24 h-px bg-white my-2" />
            <Link
              to="/auth/login"
              className="hover:text-primary-yellow hover:font-semibold transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
