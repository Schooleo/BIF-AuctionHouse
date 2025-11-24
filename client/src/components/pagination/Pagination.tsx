import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageButton from "./PageButton";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null; // Don't show pagination if only one page exists
  }

  const pagesToShow: (number | "...")[] = [];
  const maxButtons = 5; // Max number of visible buttons (e.g., 1, 2, 3, 4, 5)

  // Function to generate a range of page numbers
  const range = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (totalPages <= maxButtons) {
    // If few pages, show all buttons
    pagesToShow.push(...range(1, totalPages));
  } else {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    // Always show page 1
    if (start > 1) {
      pagesToShow.push(1);
      if (start > 2) pagesToShow.push("...");
    }

    // Show pages around the current page
    pagesToShow.push(
      ...range(start, end).filter((p) => p !== 1 && p !== totalPages)
    );

    // Always show the last page
    if (end < totalPages) {
      if (end < totalPages - 1) pagesToShow.push("...");
      pagesToShow.push(totalPages);
    }

    // Filter duplicates and sort
    const uniquePages = Array.from(new Set(pagesToShow));
    uniquePages.sort((a, b) =>
      typeof a === "number" && typeof b === "number" ? a - b : 0
    );
    pagesToShow.length = 0;
    pagesToShow.push(...uniquePages);
  }

  return (
    <div className="flex justify-center items-center my-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 mx-1 rounded text-gray-600 hover:scale-125 disabled:opacity-50 transition-transform duration-150"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Page Numbers */}
      {pagesToShow.map((page, index) => (
        <PageButton
          key={index}
          page={page}
          isActive={page === currentPage}
          onClick={() => typeof page === "number" && onPageChange(page)}
        />
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 mx-1 rounded text-gray-600 hover:scale-125 disabled:opacity-50 transition-transform duration-150"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
