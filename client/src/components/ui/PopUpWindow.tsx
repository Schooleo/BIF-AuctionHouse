import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import Spinner from "./Spinner";

interface PopUpWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void;
  title: string;
  children: React.ReactNode;

  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "auto";
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  hideSubmitButton?: boolean;
  hideCancelButton?: boolean;
  hideFooter?: boolean;
  noPadding?: boolean;
  contentClassName?: string;
  closeOnOverlayClick?: boolean;
  submitButtonColor?: string;
  cancelButtonColor?: string;
}

const PopUpWindow: React.FC<PopUpWindowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onCancel,
  title,
  children,
  size = "md",
  submitText = "Submit",
  cancelText = "Cancel",
  isLoading = false,
  hideSubmitButton = false,
  hideCancelButton = false,
  hideFooter = false,
  noPadding = false,
  contentClassName = "",
  closeOnOverlayClick = false,
  submitButtonColor,
  cancelButtonColor,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, isLoading]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Size mapping
  const sizeClasses = {
    sm: "w-full max-w-sm",
    md: "w-full max-w-md",
    lg: "w-full max-w-lg",
    xl: "w-full max-w-xl",
    "2xl": "w-full max-w-2xl",
    "3xl": "w-full max-w-3xl",
    "4xl": "w-full max-w-4xl",
    "5xl": "w-full max-w-5xl",
    "6xl": "w-full max-w-6xl",
    "7xl": "w-full max-w-7xl",
    auto: "w-auto max-w-[95vw]",
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !isLoading) {
      await onSubmit();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && !isLoading) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-xl shadow-xl ${sizeClasses[size]} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 relative`}
        style={{ overflow: "hidden" }} // Force overflow hidden to prevent any CSS leaks
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-primary-blue text-white shrink-0">
          <h3 className="text-lg font-bold truncate pr-4" title={title}>
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`text-white/80 hover:text-white transition-colors ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Footer Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
          <div className={`${noPadding ? "p-0" : "p-6"} overflow-y-auto flex-1 min-h-0 ${contentClassName}`}>
            {children}
          </div>

          {/* Footer with buttons - Same style as ConfirmationModal */}
          {!hideFooter && (
            <div className="flex justify-center gap-4 p-6 pt-0 shrink-0 mt-4">
              {!hideCancelButton && (
                <button
                  type="button"
                  onClick={onCancel || onClose}
                  disabled={isLoading}
                  className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-colors min-w-[100px] ${
                    cancelButtonColor || "text-gray-700 bg-gray-100 hover:bg-gray-200"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {cancelText}
                </button>
              )}

              {!hideSubmitButton && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2.5 text-sm font-semibold text-white rounded-full transition-colors shadow-md min-w-[100px] hover:scale-105 ${
                    submitButtonColor || "bg-primary-blue"
                  } ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    submitText
                  )}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PopUpWindow;
