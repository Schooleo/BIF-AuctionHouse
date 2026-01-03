import React, { useState } from "react";
import { useAuthStore } from "@stores/useAuthStore";
import { useAlertStore } from "@stores/useAlertStore";
import { adminApi } from "@services/admin.api";
import ProfileImage from "@components/shared/ProfileImage";
import ProfileInfoForm from "@components/forms/ProfileInfoForm";
import ProfilePasswordForm from "@components/forms/ProfilePasswordForm";
import { Lock } from "lucide-react";
import type { UpdateProfileDto, ChangePasswordDto } from "@interfaces/bidder";
import type { User } from "@interfaces/admin";

const AdminProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { addAlert } = useAlertStore();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleUpdateProfile = async (data: UpdateProfileDto) => {
    try {
      setLoading(true);
      // Ensure data conforms to what adminApi expects
      const response = await adminApi.updateProfile(
        data as unknown as Partial<User>
      );

      const updatedProfile =
        (response as unknown as { profile: User }).profile || response;

      setUser({
        ...user,
        ...updatedProfile,
      });
      addAlert("success", "Profile updated successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update profile";
      addAlert("error", message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordDto) => {
    try {
      setLoading(true);
      await adminApi.changePassword(data);
      addAlert("success", "Password changed successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to change password";
      addAlert("error", message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your account information and security settings.
        </p>
      </div>

      <div className="flex gap-6 items-start flex-col md:flex-row">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-4 w-full md:w-1/3">
          <ProfileImage
            src={user.avatar}
            alt={user.name}
            onImageUpdate={(newUrl) => setUser({ ...user, avatar: newUrl })}
            size="w-32 h-32"
          />
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full uppercase">
              {user.role}
            </span>
            <p className="text-xs text-gray-400 mt-2">
              Created at: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Forms */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-8 w-full">
          {/* Profile Info */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Personal Information
            </h2>
            <ProfileInfoForm
              initialData={{
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                address: user.address || "",
                contactEmail: user.contactEmail,
                dateOfBirth: user.dateOfBirth,
              }}
              onSubmit={handleUpdateProfile}
              loading={loading}
            />
          </div>

          {/* Change Password */}
          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <Lock size={20} /> Change Password
            </h3>
            <ProfilePasswordForm
              onSubmit={handleChangePassword}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
