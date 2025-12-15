import React, { useState } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
  color?: string; // Optional indicator color
}

interface SidebarFilterProps {
  title?: string;
  options: FilterOption[];
  currentValue: string;
  onFilterChange: (value: string) => void;
  className?: string;
}

const SidebarFilter: React.FC<SidebarFilterProps> = ({
  title = "Filters",
  options,
  currentValue,
  onFilterChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Mobile Toggle / Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 md:cursor-default md:bg-white md:border-b-0 md:pb-2"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <Filter className="w-5 h-5" />
          <span>{title}</span>
        </div>
        <div className="md:hidden text-gray-500">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Filter List */}
      <div className={`${isOpen ? "block" : "hidden"} md:block p-2 md:p-4 md:pt-0`}>
        <div className="flex flex-col gap-1">
          {options.map((option) => {
            const isActive = currentValue === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {option.color && (
                    <span
                      className={`w-2 h-2 rounded-full ${option.color}`}
                    ></span>
                  )}
                  <span>{option.label}</span>
                </div>
                {option.count !== undefined && (
                  <span
                    className={`
                      text-xs py-0.5 px-2 rounded-full
                      ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }
                    `}
                  >
                    {option.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SidebarFilter;
