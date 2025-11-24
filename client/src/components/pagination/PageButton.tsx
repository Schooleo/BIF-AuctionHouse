interface PageButtonProps {
  page: number | "...";
  isActive: boolean;
  onClick: () => void;
}

const PageButton = ({ page, isActive, onClick }: PageButtonProps) => (
  <button
    onClick={page !== "..." ? onClick : undefined}
    disabled={page === "..."}
    className={`
        px-3 py-1 mx-1 rounded text-sm transition-colors duration-200
        ${
          isActive
            ? "bg-primary-blue text-white font-bold"
            : "bg-primary-blue/50 text-white hover:bg-primary-blue/70"
        }
        ${page === "..." ? "text-gray-500 cursor-default" : ""}
      `}
  >
    {page}
  </button>
);

export default PageButton;
