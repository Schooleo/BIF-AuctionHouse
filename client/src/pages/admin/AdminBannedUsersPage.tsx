import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  bannedUsersApi,
  adminApi,
  type BannedUser,
  type UnbanRequestData,
} from "../../services/admin.api";
import BannedUserCard from "../../components/admin/user/BannedUserCard";
import BanInfoModal from "../../components/admin/user/BanInfoModal";
import Spinner from "../../components/ui/Spinner";
import { useAlertStore } from "../../stores/useAlertStore";
import { ShieldX, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

const AdminBannedUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addAlert } = useAlertStore();

  // State
  const [users, setUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [selectedUser, setSelectedUser] = useState<BannedUser | null>(null);
  const [unbanRequest, setUnbanRequest] = useState<UnbanRequestData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch banned users
  const fetchBannedUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bannedUsersApi.getBannedUsers(page, 10);
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error: any) {
      addAlert("error", error.message || "Failed to fetch banned users");
    } finally {
      setLoading(false);
    }
  }, [page, addAlert]);

  useEffect(() => {
    fetchBannedUsers();
  }, [fetchBannedUsers]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    setSearchParams(params, { replace: true });
  }, [page, setSearchParams]);

  // Handle card click
  const handleCardClick = async (user: BannedUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);

    // Fetch unban request if exists
    if (user.hasUnbanRequest) {
      try {
        const request = await bannedUsersApi.getUnbanRequest(user._id);
        setUnbanRequest(request);
      } catch {
        setUnbanRequest(null);
      }
    } else {
      setUnbanRequest(null);
    }
  };

  // Handle unban
  const handleUnban = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await adminApi.unblockUser(selectedUser._id);
      addAlert("success", `${selectedUser.name} has been unbanned`);
      fetchBannedUsers();
    } catch (error: any) {
      addAlert("error", error.message || "Failed to unban user");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle deny request
  const handleDenyRequest = async (adminNote?: string) => {
    if (!unbanRequest) return;
    setIsProcessing(true);
    try {
      await bannedUsersApi.denyUnbanRequest(unbanRequest._id, adminNote);
      addAlert("success", "Unban request has been denied");
      fetchBannedUsers();
    } catch (error: any) {
      addAlert("error", error.message || "Failed to deny request");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await adminApi.deleteUser(selectedUser._id);
      addAlert("success", `Account ${selectedUser.name} has been deleted`);
      fetchBannedUsers();
    } catch (error: any) {
      addAlert("error", error.message || "Failed to delete account");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-gray-500 hover:text-primary-blue transition-colors mb-2 group text-sm"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Users
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Banned Users
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} user{total !== 1 ? "s" : ""} currently banned
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <ShieldX size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No banned users
          </h3>
          <p className="text-gray-400">
            There are no banned users at the moment
          </p>
        </div>
      ) : (
        <>
          {/* User List */}
          <div className="space-y-3">
            {users.map((user) => (
              <BannedUserCard
                key={user._id}
                user={user}
                onClick={() => handleCardClick(user)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Ban Info Modal */}
      <BanInfoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
          setUnbanRequest(null);
        }}
        user={selectedUser}
        unbanRequest={unbanRequest}
        onUnban={handleUnban}
        onDenyRequest={handleDenyRequest}
        onDeleteAccount={handleDeleteAccount}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default AdminBannedUsersPage;
