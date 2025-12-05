import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Star, Trophy, ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuthStore } from "@stores/useAuthStore";
import { bidderApi } from "@services/bidder.api";
import type {
  UpdateProfileDto,
  ChangePasswordDto,
  UpgradeRequestStatus,
} from "@interfaces/bidder";
import ProfileInfoForm from "@components/forms/ProfileInfoForm";
import ProfilePasswordForm from "@components/forms/ProfilePasswordForm";
import RatingsReceivedList from "@components/user/RatingsReceivedList";
import WonAuctionsTab from "@components/user/WonAuctionsTab";
import SellerUpgradeModal from "@components/user/SellerUpgradeModal";

type TabType = "info" | "ratings" | "won";

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeRequest, setUpgradeRequest] =
    useState<UpgradeRequestStatus | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await bidderApi.getProfile();
      setUser({ ...response.profile, id: response.profile._id });
    } catch (err: unknown) {
      console.error("Failed to fetch profile:", err);
    }
  }, [setUser]);

  const fetchUpgradeStatus = useCallback(async () => {
    try {
      const response = await bidderApi.getUpgradeRequestStatus();
      setUpgradeRequest(response.request);
    } catch (err: unknown) {
      console.error("Failed to fetch upgrade status:", err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchUpgradeStatus();
  }, [fetchProfile, fetchUpgradeStatus]);

  const handleUpdateProfile = async (data: UpdateProfileDto) => {
    try {
      setLoading(true);
      const response = await bidderApi.updateProfile(data);
      setUser({ ...response.profile, id: response.profile._id });
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to update profile";
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: ChangePasswordDto) => {
    try {
      setLoading(true);
      await bidderApi.changePassword(data);
      setSuccessMessage(
        "Password changed successfully! Redirecting to login page..."
      );

      // Logout and redirect to login
      setTimeout(() => {
        navigate("/auth/logout?next=/auth/login");
      }, 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to change password";
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeRequest = async (reason: string) => {
    try {
      setUpgradeLoading(true);
      await bidderApi.requestSellerUpgrade(reason);
      setSuccessMessage(
        "Request sent successfully! Admin will review within 7 days."
      );
      setIsUpgradeModalOpen(false);
      await fetchUpgradeStatus();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to send request";
      throw new Error(message);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const canRequestUpgrade = () => {
    if (!upgradeRequest) return true;
    if (upgradeRequest.status === "approved") return false;
    if (upgradeRequest.status === "pending") return false;
    return true;
  };

  const getUpgradeButtonText = () => {
    if (!upgradeRequest) return "Want to be a seller?";
    if (upgradeRequest.status === "pending") return "Request Pending";
    if (upgradeRequest.status === "approved") return "Already a Seller";
    return "Resubmit Request";
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const positiveRatings = user.positiveRatings ?? 0;
  const negativeRatings = user.negativeRatings ?? 0;

  const reputationPercentage =
    positiveRatings + negativeRatings > 0
      ? Math.round(
          (positiveRatings / (positiveRatings + negativeRatings)) * 100
        )
      : 0;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Personal Info", icon: <User size={18} /> },
    { id: "ratings", label: "Ratings Received", icon: <Star size={18} /> },
    { id: "won", label: "Won Auctions", icon: <Trophy size={18} /> },
  ];

  return (
    <div className="flex gap-6 py-8">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0">
        <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
          <nav className="flex flex-col">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Reputation:</span>
                  <span className="font-semibold text-blue-600">
                    {reputationPercentage}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <ThumbsUp size={16} /> {positiveRatings}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <ThumbsDown size={16} /> {negativeRatings}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
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

              {/* Change Password Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lock size={20} />
                  Change Password
                </h3>
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <span className="font-semibold">⚠️ Note:</span> After
                    changing your password, you will need to log in again with
                    your new password.
                  </p>
                </div>
                <ProfilePasswordForm
                  onSubmit={handleChangePassword}
                  loading={loading}
                />
              </div>

              {/* Upgrade to Seller Button */}
              {user.role === "bidder" && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-3">
                    Account Upgrade
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Become a seller to post products and create auctions on our
                    platform.
                  </p>
                  {upgradeRequest?.status === "rejected" &&
                    upgradeRequest.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">
                            Rejection reason:
                          </span>{" "}
                          {upgradeRequest.rejectionReason}
                        </p>
                      </div>
                    )}
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    disabled={!canRequestUpgrade()}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {getUpgradeButtonText()}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "ratings" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Ratings Received</h2>
              <RatingsReceivedList />
            </div>
          )}

          {activeTab === "won" && (
            <div>
              <h2 className="text-xl font-bold mb-6">Won Auctions</h2>
              <WonAuctionsTab />
            </div>
          )}
        </div>

        {/* Seller Upgrade Modal */}
        <SellerUpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          onSubmit={handleUpgradeRequest}
          loading={upgradeLoading}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
