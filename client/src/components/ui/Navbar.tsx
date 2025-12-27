import { useState } from "react";
import { Search } from "lucide-react";
import Logo from "./Logo";
import SearchBar from "../forms/SearchBar";
import NavLinks from "../navbar/NavLinks";
import NavAuthLinks from "../navbar/NavAuthLinks";
import NavMobileMenu from "../navbar/NavMobileMenu";
import MobileMenuButton from "../navbar/MobileMenuButton";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="bg-primary-blue shadow-md relative">
      <div className="relative flex items-center justify-between w-full px-4 sm:px-6 md:px-8 py-1 gap-4">
        <div className="flex items-center space-x-8 shrink-0 pl-4">
          <Logo logoSizes={[12, 16, 20]} />
          <NavLinks />
        </div>

        {/* Desktop SearchBar */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <SearchBar placeholder="Search..." />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden text-white hover:text-primary-yellow transition-colors"
          >
            <Search size={24} />
          </button>

          <div className="hidden md:flex items-center space-x-6 text-white text-xl">
            <NavAuthLinks />
          </div>

          <div className="md:hidden">
            <MobileMenuButton
              isOpen={isMobileMenuOpen}
              toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </div>
      </div>

      {/* Mobile SearchBar Dropdown */}
      {showMobileSearch && (
        <div className="md:hidden bg-primary-blue border-t border-white/20 px-4 py-3">
          <SearchBar placeholder="Search..." />
        </div>
      )}

      {isMobileMenuOpen && (
        <NavMobileMenu closeMenu={() => setIsMobileMenuOpen(false)} />
      )}
    </header>
  );
}
