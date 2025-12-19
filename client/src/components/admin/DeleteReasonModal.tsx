import React, { useState, useEffect } from "react";
import PopUpWindow from "../ui/PopUpWindow";

interface DeleteReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
  isLoading?: boolean;
}

const DeleteReasonModal: React.FC<DeleteReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Reset reason when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    // We can await this if onConfirm is async, managed by PopUpWindow's loading state
    onConfirm(reason);
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      submitText="Confirm Delete"
      cancelText="Cancel"
      isLoading={isLoading}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Reason for Deletion <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors ${
              error
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-primary-blue/30 focus:border-primary-blue"
            }`}
            placeholder="E.g., Violated terms of service..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800">
          <p>
            This action will mark the user as deleted but preserve their data
            history.
          </p>
        </div>
      </div>
    </PopUpWindow>
  );
};

export default DeleteReasonModal;
