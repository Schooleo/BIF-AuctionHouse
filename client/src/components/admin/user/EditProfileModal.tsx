import React, { useState, useEffect } from "react";
import PopUpWindow from "../../ui/PopUpWindow";
import {
  validateUsername,
  validateEmail,
  validateAddress,
} from "../../../utils/validation";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileData) => Promise<void>;
  initialData: ProfileData;
}

export interface ProfileData {
  name: string;
  email: string;
  address?: string;
  contactEmail?: string;
  dateOfBirth?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  address?: string;
  contactEmail?: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
      setApiError(null);
    }
  }, [isOpen, initialData]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const nameError = validateUsername(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    if (formData.address) {
      const addressError = validateAddress(formData.address, false);
      if (addressError) newErrors.address = addressError;
    }

    if (formData.contactEmail) {
      const contactEmailError = validateEmail(formData.contactEmail);
      if (contactEmailError) newErrors.contactEmail = contactEmailError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <PopUpWindow
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Edit User Profile"
      submitText="Save Changes"
      isLoading={isLoading}
      size="lg"
    >
      <div className="space-y-4">
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {apiError}
          </div>
        )}

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.name
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-500/30 focus:border-blue-500"
            }`}
            placeholder="Enter username"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.email
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-500/30 focus:border-blue-500"
            }`}
            placeholder="Enter email"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email
          </label>
          <input
            type="email"
            value={formData.contactEmail || ""}
            onChange={(e) => handleChange("contactEmail", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.contactEmail
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-500/30 focus:border-blue-500"
            }`}
            placeholder="Enter contact email (optional)"
          />
          {errors.contactEmail && (
            <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={formData.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.address
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-500/30 focus:border-blue-500"
            }`}
            placeholder="Enter address"
          />
          {errors.address && (
            <p className="mt-1 text-xs text-red-500">{errors.address}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={
              formData.dateOfBirth ? formData.dateOfBirth.split("T")[0] : ""
            }
            onChange={(e) => handleChange("dateOfBirth", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>

        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> Changing email may affect user's ability to
            login.
          </p>
        </div>
      </div>
    </PopUpWindow>
  );
};

export default EditProfileModal;
