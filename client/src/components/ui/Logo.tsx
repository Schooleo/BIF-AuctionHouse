import { Link } from "react-router-dom";
import type { LogoProps } from "@interfaces/ui";
import logo from "@img/BIF-logo.png";

const Logo = ({ logoSizes, spanText, className }: LogoProps) => {
  logoSizes = logoSizes || [12, 16, 20];

  return (
    <Link
      to="/"
      className={`flex items-center space-x-2 sm:space-x-3 ${className}`}
    >
      <img
        src={logo}
        alt="Logo Image"
        className={`h-${logoSizes[0]} w-${logoSizes[0]} sm:h-${logoSizes[1]} sm:w-${logoSizes[1]} md:h-${logoSizes[2]} md:w-${logoSizes[2]}`}
      />
      {spanText && (
        <span className="text-white text-lg sm:text-xl md:text-2xl font-serif font-semibold whitespace-nowrap">
          {spanText}
        </span>
      )}
    </Link>
  );
};

export default Logo;
