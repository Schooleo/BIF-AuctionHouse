import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import type { SearchBarProps } from "@interfaces/ui";

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChange,
  onSubmit,
  className,
}) => {
  const [internalValue, setInternalValue] = useState<string>(value || "");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    if (!value) {
      setInternalValue(q);
    }
  }, [location.search, value]);

  const currentValue = value !== undefined ? value : internalValue;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (onChange) {
      onChange(e);
    } else {
      setInternalValue(e.target.value);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = currentValue.trim();

    if (onSubmit) {
      onSubmit(trimmed);
      return;
    }

    // Chuyển qua trang products với tham số tìm kiếm
    const searchParams = new URLSearchParams();
    if (trimmed) {
      searchParams.set("q", trimmed);
    }

    const currentParams = new URLSearchParams(location.search);
    const category = currentParams.get("category");
    if (category) searchParams.set("category", category);

    if (location.pathname.startsWith("/seller")) {
      if (location.pathname.includes("ended-products")) {
        navigate(`/seller/ended-products?${searchParams.toString()}`);
      } else {
        navigate(`/seller/products?${searchParams.toString()}`);
      }
    } else if (location.pathname.startsWith("/admin")) {
      const path = location.pathname;
      if (
        path.startsWith("/admin/products") ||
        path.startsWith("/admin/categories") ||
        path.startsWith("/admin/users") ||
        path.startsWith("/admin/orders") ||
        path.startsWith("/admin/upgrade-requests")
      ) {
        // Stay in current section (redirect to list view of that section)
        const section = path.split("/")[2];
        navigate(`/admin/${section}?${searchParams.toString()}`);
      } else {
        navigate(`/admin/products?${searchParams.toString()}`);
      }
    } else {
      navigate(`/products?${searchParams.toString()}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full justify-around rounded-full border border-white text-white focus:outline-none focus:ring-white bg-secondary-blue ${className}`}
    >
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full max-w-sm px-4 py-2 placeholder-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="mr-3 text-gray-300 hover:text-gray-100 hover:scale-110 transition-all duration-200"
      >
        <Search size={20} />
      </button>
    </form>
  );
};

export default SearchBar;
