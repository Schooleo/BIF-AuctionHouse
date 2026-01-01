import React, { useState, useEffect } from "react";
import PopUpWindow from "../ui/PopUpWindow";

interface BlockReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  userName: string;
  isLoading?: boolean;
}

const BlockReasonModal: React.FC<BlockReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for blocking.");
      return;
    }
    onConfirm(reason);
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Block User Account"
      submitText="Block User"
      cancelText="Cancel"
      isLoading={isLoading}
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <p className="text-sm text-gray-700">
            You are about to block{" "}
            <span className="font-semibold">{userName}</span>. They will not be
            able to access their account until unblocked.
          </p>
        </div>

        <div>
          <label
            htmlFor="block-reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Reason for blocking <span className="text-red-500">*</span>
          </label>
          <textarea
            id="block-reason"
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors ${
              error
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-500/30 focus:border-blue-500"
            }`}
            placeholder="E.g., Violated community guidelines, spam behavior..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </PopUpWindow>
  );
};

export default BlockReasonModal;
