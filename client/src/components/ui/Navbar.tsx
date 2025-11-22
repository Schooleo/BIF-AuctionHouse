import { useState } from "react";
import Logo from "./Logo";
import SearchBar from "../forms/SearchBar";
import NavLinks from "../navbar/NavLinks";
import NavAuthLinks from "../navbar/NavAuthLinks";
import NavMobileMenu from "../navbar/NavMobileMenu";
import MobileMenuButton from "../navbar/MobileMenuButton";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary-blue shadow-md relative">
      <div className="relative flex items-center w-full px-4 sm:px-6 md:px-8 py-3">
        <div className="flex items-center space-x-6 z-10">
          <Logo logoSizes={[12, 16, 20]} />
          <NavLinks />
        </div>

        {/*Canh giữa*/}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md md:flex">
          <SearchBar placeholder="Search..." />
        </div>

        <div className="ml-auto hidden md:flex items-center space-x-6 text-white text-xl z-10">
          <NavAuthLinks />
        </div>

        <div className="md:hidden ml-auto z-10">
          <MobileMenuButton
            isOpen={isMobileMenuOpen}
            toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </div>
      </div>

      {isMobileMenuOpen && (
        <NavMobileMenu closeMenu={() => setIsMobileMenuOpen(false)} />
      )}
    </header>
  );
}
