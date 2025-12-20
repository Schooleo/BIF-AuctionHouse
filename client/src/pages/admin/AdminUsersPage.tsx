import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { User } from "../../services/admin.api";
import { adminApi } from "../../services/admin.api";
import DeleteReasonModal from "../../components/admin/DeleteReasonModal";
import {
  Search,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
} from "lucide-react";

interface QueryParams {
  page: number;
  limit: number;
  search: string;
  role: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const AdminUsersPage: React.FC = () => {
  // Consolidated query state
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
    search: "",
    role: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // Delete State
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to update query params
  const updateQuery = useCallback((updates: Partial<QueryParams>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...updates,
      // Reset to page 1 when filters/sort change (unless page is explicitly set)
      page: updates.page !== undefined ? updates.page : 1,
    }));
  }, []);

  // Fetch Data
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        page: queryParams.page,
        limit: queryParams.limit,
        q: queryParams.search || undefined,
        role: queryParams.role || undefined,
        status: queryParams.status || undefined,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      });
      setUsers(res.users);
      setTotalPages(res.totalPages);
      setTotalDocs(res.totalDocs);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Debounced fetch on queryParams change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400); // 400ms debounce for search

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Handlers
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const previousStatus = user.status;

    // Optimistic Update
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
    );

    try {
      await adminApi.updateUser(user._id, { status: newStatus });
    } catch (error) {
      console.error("Failed to toggle status:", error);
      // Revert if error
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, status: previousStatus } : u
        )
      );
      alert("Failed to update status");
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (reason: string) => {
    if (!selectedUserToDelete) return;

    setIsDeleting(true);
    try {
      await adminApi.deleteUser(selectedUserToDelete._id, reason);
      setIsDeleteModalOpen(false);
      setSelectedUserToDelete(null);
      fetchUsers(); // Refetch list
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-blue">
          Users Management
        </h1>
        <p className="text-gray-500 mt-1">
          Manage all registered users in the system
        </p>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          {/* Left: Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, email..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all"
              value={queryParams.search}
              onChange={(e) => updateQuery({ search: e.target.value })}
            />
          </div>

          {/* Right: Filters Group */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter size={18} className="text-gray-400" />

            {/* Role Filter */}
            <select
              value={queryParams.role}
              onChange={(e) => updateQuery({ role: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm bg-white cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="bidder">BIDDER</option>
              <option value="seller">SELLER</option>
              <option value="admin">ADMIN</option>
            </select>

            {/* Status Filter */}
            <select
              value={queryParams.status}
              onChange={(e) => updateQuery({ status: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm bg-white cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={`${queryParams.sortBy}-${queryParams.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                updateQuery({
                  sortBy,
                  sortOrder: sortOrder as "asc" | "desc",
                });
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue text-sm bg-white cursor-pointer"
            >
              <option value="createdAt-desc">Newest Joined</option>
              <option value="createdAt-asc">Oldest Joined</option>
              <option value="reputation-desc">High Reputation</option>
              <option value="reputation-asc">Low Reputation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/users/${user._id}`}
                        className="flex items-center gap-3 group/link"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue font-bold group-hover/link:ring-2 group-hover/link:ring-primary-blue/20 transition-all">
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
                          <p className="font-semibold text-gray-900 group-hover/link:text-primary-blue transition-colors">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "seller"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(user);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border
                          ${
                            user.status === "ACTIVE"
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                      >
                        {user.status === "ACTIVE" ? (
                          <ShieldCheck size={14} />
                        ) : (
                          <ShieldAlert size={14} />
                        )}
                        {user.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/users/${user._id}`}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium">
              {(queryParams.page - 1) * queryParams.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(queryParams.page * queryParams.limit, totalDocs)}
            </span>{" "}
            of <span className="font-medium">{totalDocs}</span> results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                updateQuery({ page: Math.max(1, queryParams.page - 1) })
              }
              disabled={queryParams.page <= 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                updateQuery({
                  page: Math.min(totalPages, queryParams.page + 1),
                })
              }
              disabled={queryParams.page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteReasonModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={`Delete User: ${selectedUserToDelete?.name}`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminUsersPage;
