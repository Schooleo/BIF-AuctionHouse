import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import Spinner from "./Spinner";

interface PopUpWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void | Promise<void>;
  title: string;
  children: React.ReactNode;

  size?: "sm" | "md" | "lg" | "xl";
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  hideSubmitButton?: boolean;
}

const PopUpWindow: React.FC<PopUpWindowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  size = "md",
  submitText = "Submit",
  cancelText = "Cancel",
  isLoading = false,
  hideSubmitButton = false,
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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  // Size mapping
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !isLoading) {
      await onSubmit();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-primary-blue text-white">
          <h3 className="text-lg font-bold">{title}</h3>
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

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>

          {/* Footer with buttons - Same style as ConfirmationModal */}
          <div className="flex justify-center gap-4 p-6 pt-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors min-w-[100px] ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {cancelText}
            </button>

            {!hideSubmitButton && (
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2.5 text-sm font-semibold text-white rounded-full transition-colors shadow-md min-w-[100px] bg-primary-blue hover:scale-105 ${
                  isLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
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
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PopUpWindow;
