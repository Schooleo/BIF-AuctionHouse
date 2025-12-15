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
  const maxButtons = 5;

  if (totalPages <= maxButtons) {
    for (let i = 1; i <= totalPages; i++) {
      pagesToShow.push(i);
    }
  } else {
    // Always show first page
    pagesToShow.push(1);

    // Calculate start and end of neighbors
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Dynamic adjustment for edges to keep constant number of buttons roughly
    if (currentPage <= 3) {
      startPage = 2;
      endPage = 4; // Show 1, 2, 3, 4 ... Last
    } else if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
      endPage = totalPages - 1; // Show First ... 7, 8, 9, 10
    }

    // Add ellipsis before start if gap exists
    if (startPage > 2) {
      pagesToShow.push("...");
    }

    // Add neighbors
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        pagesToShow.push(i);
      }
    }

    // Add ellipsis after end if gap exists
    if (endPage < totalPages - 1) {
      pagesToShow.push("...");
    }

    // Always show last page
    pagesToShow.push(totalPages);
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
