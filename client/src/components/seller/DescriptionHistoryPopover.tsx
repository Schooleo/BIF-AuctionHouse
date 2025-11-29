import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DescriptionHistoryPopoverProps {
  description: string;
  descriptionHistory?: {
    content: string;
    updatedAt: string;
  }[];
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const DescriptionHistoryPopover: React.FC<DescriptionHistoryPopoverProps> = ({
  description,
  descriptionHistory,
  onClose,
  triggerRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, triggerRef]);

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-20 max-h-60 overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-gray-900 text-sm">Description</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Original:</p>
          <p className="text-xs text-gray-600 whitespace-pre-line">
            {description}
          </p>
        </div>
        {descriptionHistory && descriptionHistory.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1 mt-2">
              Updates:
            </p>
            <div className="space-y-2">
              {descriptionHistory.map((hist, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-2 rounded border border-gray-100"
                >
                  <p className="text-[10px] text-gray-500 mb-1">
                    {new Date(hist.updatedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 whitespace-pre-line">
                    {hist.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DescriptionHistoryPopover;
