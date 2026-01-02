import React, { useState } from "react";
import PopUpWindow from "@components/ui/PopUpWindow";
import ConfirmationModal from "@components/ui/ConfirmationModal";

const URL_REGEX = /(https?:\/\/|www\.)/gi;

interface SellerUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, reasons: string) => Promise<void>;
  loading?: boolean;
}

const SellerUpgradeModal: React.FC<SellerUpgradeModalProps> = ({ isOpen, onClose, onSubmit, loading = false }) => {
  const [title, setTitle] = useState("");
  const [reasons, setReasons] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle("");
      setReasons("");
      setError(null);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  const handleValidateAndShowConfirm = () => {
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title for your request");
      return;
    }

    if (title.trim().length < 10) {
      setError("Title must be at least 10 characters");
      return;
    }

    if (title.length > 100) {
      setError("Title must be less than 100 characters");
      return;
    }

    if (!reasons.trim()) {
      setError("Please enter your reasons for wanting to become a seller");
      return;
    }

    if (reasons.trim().length < 100) {
      setError("Reasons must be at least 100 characters");
      return;
    }

    if (reasons.length > 1000) {
      setError("Reasons must be less than 1000 characters");
      return;
    }

    if (URL_REGEX.test(title) || URL_REGEX.test(reasons)) {
      setError("Title and reasons cannot contain URLs or hyperlinks");
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    try {
      await onSubmit(title.trim(), reasons.trim());
      setTitle("");
      setReasons("");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  return (
    <>
      <PopUpWindow
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleValidateAndShowConfirm}
        title="Request to Become a Seller"
        submitText="Submit Request"
        isLoading={loading}
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">ℹ️ Note:</span> You can only send ONE upgrade request per week. After
              submitting, admin will review and respond within 7 days.
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Request Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief title for your request..."
              disabled={loading}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters (minimum 10)</p>
          </div>

          <div>
            <label htmlFor="reasons" className="block text-sm font-medium text-gray-700 mb-2">
              Reasons for Wanting to Become a Seller <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reasons"
              value={reasons}
              onChange={(e) => setReasons(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Explain in detail why you want to become a seller on our platform..."
              disabled={loading}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{reasons.length}/1000 characters (minimum 100)</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </PopUpWindow>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Upgrade Request"
        message="You can only send ONE upgrade request per week. Do you want to continue?"
        confirmText="Yes, Continue"
        cancelText="Cancel"
        type="info"
      />
    </>
  );
};

export default SellerUpgradeModal;
