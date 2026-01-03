import { useState } from "react";
import PasswordField from "@components/forms/PasswordField";
import Button from "@components/forms/Button";
import type { ChangePasswordDto } from "@interfaces/bidder";
import { validatePassword } from "@utils/validation";

interface ProfilePasswordFormProps {
  onSubmit: (data: ChangePasswordDto) => Promise<void>;
  loading?: boolean;
}

const ProfilePasswordForm: React.FC<ProfilePasswordFormProps> = ({
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Please enter your current password";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Please enter a new password";
    } else {
      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!validate()) return;

    try {
      setSubmitting(true);
      setErrors({});

      await onSubmit({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setSuccess(true);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Auto hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "An error occurred" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Password <span className="text-red-500">*</span>
        </label>
        <PasswordField
          label="Current Password"
          value={formData.currentPassword}
          onChange={(e) =>
            setFormData({ ...formData, currentPassword: e.target.value })
          }
          error={errors.currentPassword}
          disabled={loading || submitting}
          placeholder="Enter your current password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password <span className="text-red-500">*</span>
        </label>
        <PasswordField
          label="New Password"
          value={formData.newPassword}
          onChange={(e) =>
            setFormData({ ...formData, newPassword: e.target.value })
          }
          error={errors.newPassword}
          disabled={loading || submitting}
          placeholder="Enter new password (min 8 chars, 1 upper, 1 special)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password <span className="text-red-500">*</span>
        </label>
        <PasswordField
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          error={errors.confirmPassword}
          disabled={loading || submitting}
          placeholder="Re-enter new password"
        />
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {errors.submit}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600">
          Password changed successfully!
        </div>
      )}

      <Button
        type="submit"
        label={submitting ? "Updating..." : "Change Password"}
        disabled={loading || submitting}
        className="w-full"
      />
    </form>
  );
};

export default ProfilePasswordForm;
