import { Link } from "react-router-dom";
import type { LogoProps } from "@interfaces/ui";
import logo from "@img/BIF-logo.png";

const defaultClass = "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20";

const Logo = ({ logoSizes = [12, 16, 20], spanText, className }: LogoProps) => {
  function mapLogoSize(sizes: number[]): string {
    if (!sizes || sizes.length !== 3) return defaultClass;

    return `w-${sizes[0]} h-${sizes[0]} sm:w-${sizes[1]} sm:h-${sizes[1]} md:w-${sizes[2]} md:h-${sizes[2]}`;
  }

  return (
    <Link
      to="/"
      className={`flex items-center space-x-2 sm:space-x-3 p-0.1 ${className}`}
    >
      <img
        src={logo}
        alt="Logo Image"
        className={`${mapLogoSize(logoSizes)}`}
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
