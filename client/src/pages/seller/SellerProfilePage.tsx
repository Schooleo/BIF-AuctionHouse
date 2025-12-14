import React, { useState, useEffect, useCallback } from "react";
import { Lock } from "lucide-react";
import { useAuthStore } from "@stores/useAuthStore";
import { useAlertStore } from "@stores/useAlertStore";
import { sellerApi } from "@services/seller.api";

import ProfileInfoForm from "@components/forms/ProfileInfoForm";
import ProfilePasswordForm from "@components/forms/ProfilePasswordForm";
import SellerRatingList from "@components/seller/SellerRatingList";
import { useNavigate, useSearchParams } from "react-router-dom";
import type {
  UpdateSellerProfileDto,
  ChangeSellerPasswordDto,
  SellerStats,
} from "@interfaces/seller";
import SellerOverviewTab from "@components/seller/SellerOverviewTab";

type TabType = "overview" | "info" | "ratings";

const SellerProfilePage: React.FC = () => {
  const { user, setUser, token } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabType) || "overview";
  const addAlert = useAlertStore((state) => state.addAlert);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SellerStats | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      if (!token) return;
      const response = await sellerApi.getProfile(token);

      setUser({
        ...response.profile,
        id: response.profile._id,
      });
      setStats(response.stats);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, [token, setUser]);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  const handleUpdateProfile = async (data: UpdateSellerProfileDto) => {
    try {
      setLoading(true);
      const response = await sellerApi.updateProfile(data);

      setUser({
        ...response.profile,
        id: response.profile.id,
      });
      addAlert("success", "Profile updated successfully!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update profile";
      addAlert("error", message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: ChangeSellerPasswordDto) => {
    try {
      setLoading(true);
      await sellerApi.changePassword(data);
      addAlert(
        "success",
        "Password changed successfully! Redirecting to login page..."
      );
      setTimeout(() => {
        navigate("/auth/logout?next=/auth/login");
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to change password";
      addAlert("error", message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="py-8">
      {/* Main Content */}
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Seller Profile: {user.name}
          </h1>
          <p className="text-gray-500">{user.email}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === "overview" && <SellerOverviewTab stats={stats} />}

          {activeTab === "info" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Personal Info</h2>
              <ProfileInfoForm
                initialData={{
                  name: user.name,
                  email: user.email,
                  address: user.address || "",
                }}
                onSubmit={handleUpdateProfile}
                loading={loading}
              />
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lock size={20} /> Change Password
                </h3>
                <ProfilePasswordForm
                  onSubmit={handleChangePassword}
                  loading={loading}
                />
              </div>
            </div>
          )}

          {activeTab === "ratings" && (
            <div>
              <SellerRatingList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;
