import React, { useState, useEffect } from "react";
import PopUpWindow from "../../ui/PopUpWindow";
import { validatePassword } from "../../../utils/validation";
import { AlertCircle, Key } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  userName: string;
  userEmail: string;
  isLoading?: boolean;
}

const DEFAULT_PASSWORD = "Password@123";

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userEmail,
  isLoading = false,
}) => {
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [customPassword, setCustomPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUseCustomPassword(false);
      setCustomPassword("");
      setConfirmPassword("");
      setError("");
      setShowConfirmation(false);
    }
  }, [isOpen]);

  const handleReview = () => {
    setError("");

    if (useCustomPassword) {
      const passwordError = validatePassword(customPassword);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (customPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    const finalPassword = useCustomPassword ? customPassword : DEFAULT_PASSWORD;
    try {
      await onConfirm(finalPassword);
      onClose();
    } catch (err) {
      setShowConfirmation(false);
      const message =
        err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setError("");
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={showConfirmation ? handleConfirm : handleReview}
      onCancel={showConfirmation ? handleBack : undefined}
      title={
        showConfirmation ? "Confirm Password Reset" : "Reset User Password"
      }
      submitText={showConfirmation ? "Confirm & Send Email" : "Review Reset"}
      cancelText={showConfirmation ? "Back to Edit" : "Cancel"}
      isLoading={isLoading}
      size="md"
    >
      {showConfirmation ? (
        // Confirmation View
        <div className="space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-1">
                  Confirm Password Reset
                </h3>
                <p className="text-sm text-amber-800">
                  This action will reset the user's password and send them an
                  email notification. Please confirm the details below.
                </p>
              </div>
            </div>
          </div>

          {/* Reset Summary */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Reset Summary</h4>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">User</span>
                <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">
                  {userName}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Email</span>
                <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">
                  {userEmail}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm">New Password</span>
                <span className="font-mono font-bold text-primary-blue text-sm">
                  {useCustomPassword ? "Custom Password" : DEFAULT_PASSWORD}
                </span>
              </div>
            </div>
          </div>

          {/* Email Notification Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Key className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                  Email Notification
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  An email will be sent to {" "}<strong>{userEmail}</strong>{" "}
                  notifying them that their password has been reset by an
                  administrator. The email will include the new password.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      ) : (
        // Input View
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  You are about to reset the password for{" "}
                  <strong>{userName}</strong>. An email will be sent to{" "}
                  <strong>{userEmail}</strong> with the new password.
                </p>
              </div>
            </div>
          </div>

          {/* Password Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="default-password"
                checked={!useCustomPassword}
                onChange={() => setUseCustomPassword(false)}
                className="w-4 h-4 text-primary-blue focus:ring-primary-blue"
              />
              <label
                htmlFor="default-password"
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium text-gray-900">
                  Use Default Password
                </div>
                <div className="text-sm text-gray-500">
                  {`Reset to: `}<code className="font-mono">{DEFAULT_PASSWORD}</code>
                </div>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="custom-password"
                checked={useCustomPassword}
                onChange={() => setUseCustomPassword(true)}
                className="w-4 h-4 text-primary-blue focus:ring-primary-blue mt-1"
              />
              <label htmlFor="custom-password" className="flex-1 cursor-pointer">
                <div className="font-medium text-gray-900 mb-2">
                  Set Custom Password
                </div>
                {useCustomPassword && (
                  <div className="space-y-3 ml-1">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="Enter new password"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Must be at least 8 characters with 1 uppercase letter
                        and 1 special character
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      )}
    </PopUpWindow>
  );
};

export default ResetPasswordModal;