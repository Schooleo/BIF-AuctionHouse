import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bannedUsersApi, adminApi } from "@services/admin.api";
import type { BannedUser, UnbanRequestData } from "@interfaces/admin";
import BanInfoModal from "@components/admin/user/BanInfoModal";
import { useAlertStore } from "@stores/useAlertStore";
import {
  ShieldX,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clock,
  Eye,
} from "lucide-react";

const AdminBannedUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addAlert } = useAlertStore();
  const searchQuery = searchParams.get("q") || "";

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
      const data = await bannedUsersApi.getBannedUsers(page, 10, searchQuery);
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      const err = error as Error;
      addAlert("error", err.message || "Failed to fetch banned users");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, addAlert]);

  useEffect(() => {
    fetchBannedUsers();
  }, [fetchBannedUsers]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    setSearchParams(params, { replace: true });
  }, [page, searchParams, setSearchParams]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Handle row click - open modal
  const handleRowClick = async (user: BannedUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);

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
    } catch (error) {
      const err = error as Error;
      addAlert("error", err.message || "Failed to unban user");
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
    } catch (error) {
      const err = error as Error;
      addAlert("error", err.message || "Failed to deny request");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete account (force delete - bypasses safeguards)
  const handleDeleteAccount = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await adminApi.forceDeleteUser(selectedUser._id);
      addAlert("success", `Account ${selectedUser.name} has been deleted`);
      fetchBannedUsers();
    } catch (error) {
      const err = error as Error;
      addAlert("error", err.message || "Failed to delete account");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Role badge styling (consistent with AdminUsersPage)
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "seller":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center gap-2 text-gray-500 hover:text-primary-blue transition-colors mb-1 group text-sm w-fit"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Users
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Banned Users</h1>
          <p className="text-sm text-gray-500">
            Manage blocked users and their unban requests
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">List of banned users</caption>

            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Banned Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Request Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center gap-3 text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Loading banned users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="space-y-3">
                      <ShieldX className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No banned users
                      </p>
                      <p className="text-sm text-gray-400">
                        There are no banned users at the moment
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-red-50/30 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleRowClick(user)}
                  >
                    {/* User column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role column */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeClass(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Banned Date column */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {user.blockedAt
                          ? new Date(user.blockedAt).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </td>

                    {/* Request Status column */}
                    <td className="px-6 py-4">
                      {user.hasUnbanRequest ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                          <Clock size={12} />
                          Pending Request
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-500 border-gray-200">
                          <ShieldX size={12} />
                          No Request
                        </span>
                      )}
                    </td>

                    {/* Actions column */}
                    <td
                      className="px-3 py-4 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRowClick(user)}
                          className="p-2.5 bg-gray-50 text-gray-500 border border-gray-200 hover:text-primary-blue hover:bg-blue-50 hover:border-blue-200 rounded-full transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium">
              {users.length > 0 ? (page - 1) * 10 + 1 : 0}
            </span>{" "}
            to <span className="font-medium">{Math.min(page * 10, total)}</span>{" "}
            of <span className="font-medium">{total}</span> banned users
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-600 min-w-20 text-center">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

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
