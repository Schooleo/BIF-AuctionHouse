import { useState, useEffect } from "react";
import InputField from "@components/forms/InputField";
import Button from "@components/forms/Button";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import type { UpdateProfileDto } from "@interfaces/bidder";
import { validateUsername, validateEmail } from "@utils/validation";

interface ProfileInfoFormProps {
  initialData: {
    name: string;
    email: string;
    avatar?: string;
    address?: string;
    dateOfBirth?: string;
    contactEmail?: string;
  };
  onSubmit: (data: UpdateProfileDto) => Promise<void>;
  loading?: boolean;
}

const COOLDOWN_TIME = 60; // 60 seconds = 1 minute
const COOLDOWN_KEY = "profile_update_cooldown";

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name,
    address: initialData.address || "",
    dateOfBirth: initialData.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
      : "",
    contactEmail: initialData.contactEmail || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Check cooldown on mount
  useEffect(() => {
    const checkCooldown = () => {
      const cooldownEnd = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownEnd) {
        const remaining = Math.max(
          0,
          Math.floor((parseInt(cooldownEnd) - Date.now()) / 1000)
        );
        if (remaining > 0) {
          setCooldownRemaining(remaining);
        } else {
          localStorage.removeItem(COOLDOWN_KEY);
        }
      }
    };

    checkCooldown();
  }, []);

  // Sync formData with initialData
  useEffect(() => {
    setFormData({
      name: initialData.name,
      address: initialData.address || "",
      dateOfBirth: initialData.dateOfBirth
        ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
        : "",
      contactEmail: initialData.contactEmail || "",
    });
  }, [initialData]);

  // Countdown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            localStorage.removeItem(COOLDOWN_KEY);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  // Check if form has changes
  const hasChanges = () => {
    const initialDob = initialData.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
      : "";
    return (
      formData.name.trim() !== initialData.name ||
      (formData.address.trim() || "") !== (initialData.address || "") ||
      formData.dateOfBirth !== initialDob ||
      (formData.contactEmail.trim() || "") !== (initialData.contactEmail || "")
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const nameError = validateUsername(formData.name.trim());
    if (nameError) newErrors.name = nameError;

    if (formData.contactEmail) {
      const emailError = validateEmail(formData.contactEmail);
      if (emailError) newErrors.contactEmail = emailError;
    }

    if (formData.address && formData.address.length > 200) {
      newErrors.address = "Address must be less than 200 characters";
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 15 || age > 120) {
        newErrors.dateOfBirth = "You must be between 15 and 120 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrors({});
      await onSubmit({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
      });

      // Set cooldown
      const cooldownEnd = Date.now() + COOLDOWN_TIME * 1000;
      localStorage.setItem(COOLDOWN_KEY, cooldownEnd.toString());
      setCooldownRemaining(COOLDOWN_TIME);
    } catch (error: unknown) {
      console.error("Failed to update profile:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClick = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isFieldDisabled = cooldownRemaining > 0 || loading || submitting;

  return (
    <>
      <form onSubmit={handleUpdateClick} className="space-y-4">
        {cooldownRemaining > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">⏱️ Cooldown:</span> You can update
              your profile again in{" "}
              <span className="font-bold">{formatTime(cooldownRemaining)}</span>
            </p>
          </div>
        )}

        {/* Row 1: Name and Date of Birth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <InputField
              label="Name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
              disabled={isFieldDisabled}
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
              disabled={isFieldDisabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Row 2: Email and Contact Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <InputField
              label="Email"
              type="email"
              value={initialData.email}
              disabled
              className="bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <InputField
              label="Contact Email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              error={errors.contactEmail}
              disabled={isFieldDisabled}
              placeholder="contact@example.com"
            />
          </div>
        </div>

        {/* Row 3: Address (full width) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <InputField
            label="Address"
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            error={errors.address}
            disabled={isFieldDisabled}
            placeholder="Enter your address"
          />
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {errors.submit}
          </div>
        )}

        {hasChanges() && cooldownRemaining === 0 && (
          <Button
            type="submit"
            label={submitting ? "Updating..." : "Update Information"}
            disabled={loading || submitting}
            className="w-full"
          />
        )}
      </form>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmit}
        title="Confirm Update"
        message="Are you sure you want to update your information?"
        confirmText="Update"
        type="info"
      />
    </>
  );
};

export default ProfileInfoForm;
