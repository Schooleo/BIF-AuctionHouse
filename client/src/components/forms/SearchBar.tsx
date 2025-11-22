import { useState } from "react";
import { Search } from "lucide-react";
import type { SearchBarProps } from "@interfaces/ui";

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder,
  value,
  onChange,
  onSubmit,
  className,
}) => {
  const [internalValue, setInternalValue] = useState<string>(value || "");

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
    onSubmit?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`hidden md:flex grow justify-around rounded-full border border-white text-white focus:outline-none focus:ring-white bg-secondary-blue ${className}`}
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
