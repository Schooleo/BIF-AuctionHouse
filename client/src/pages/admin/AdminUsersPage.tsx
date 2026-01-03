import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { User } from "@interfaces/admin";
import { adminApi } from "@services/admin.api";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import AddUserModal from "@components/admin/AddUserModal";
import { useAlertStore } from "@stores/useAlertStore";
import {
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Users,
  Eye,
  Plus,
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

const DEFAULT_PARAMS: QueryParams = {
  page: 1,
  limit: 10,
  search: "",
  role: "",
  status: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize query state from URL params or defaults
  const [queryParams, setQueryParams] = useState<QueryParams>(() => ({
    page: Number(searchParams.get("page")) || DEFAULT_PARAMS.page,
    limit: Number(searchParams.get("limit")) || DEFAULT_PARAMS.limit,
    search: searchParams.get("q") || DEFAULT_PARAMS.search,
    role: searchParams.get("role") || DEFAULT_PARAMS.role,
    status: searchParams.get("status") || DEFAULT_PARAMS.status,
    sortBy: searchParams.get("sortBy") || DEFAULT_PARAMS.sortBy,
    sortOrder:
      (searchParams.get("sortOrder") as "asc" | "desc") ||
      DEFAULT_PARAMS.sortOrder,
  }));

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // Delete State
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<User | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add User State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Update query params and sync with URL
  const updateQuery = (updates: Partial<QueryParams>) => {
    const newParams = {
      ...queryParams,
      ...updates,
      // Reset to page 1 when filters/sort change (unless page is explicitly set)
      page: updates.page !== undefined ? updates.page : 1,
    };

    setQueryParams(newParams);

    // Sync URL - only include non-default values
    const urlParams = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      const defaultValue = DEFAULT_PARAMS[key as keyof QueryParams];
      if (
        value !== "" &&
        value !== undefined &&
        value !== null &&
        value !== defaultValue
      ) {
        if (key === "search") {
          urlParams.set("q", String(value));
        } else {
          urlParams.set(key, String(value));
        }
      }
    });
    setSearchParams(urlParams, { replace: true });
  };

  // Fetch users with debouncing and abort controller
  useEffect(() => {
    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await adminApi.getUsers({
          page: queryParams.page,
          limit: queryParams.limit,
          q: queryParams.search,
          role: queryParams.role,
          status: queryParams.status,
          sortBy: queryParams.sortBy,
          sortOrder: queryParams.sortOrder,
        });

        if (!abortController.signal.aborted) {
          setUsers(res.users);
          setTotalPages(res.totalPages);
          setTotalDocs(res.totalDocs);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Failed to fetch users:", err);
        setError(err.message || "Failed to load users");
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [queryParams]);

  // Refetch users by updating queryParams
  const refetchUsers = () => {
    // Trigger re-fetch by updating queryParams with same values
    setQueryParams({ ...queryParams });
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const { addAlert } = useAlertStore();

  const confirmDelete = async () => {
    if (!selectedUserToDelete) return;

    setIsDeleting(true);
    try {
      await adminApi.deleteUser(selectedUserToDelete._id);
      setIsDeleteModalOpen(false);
      setSelectedUserToDelete(null);
      addAlert("success", "User deleted successfully");
      refetchUsers();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      addAlert("error", error.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all registered users in the system
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2.5 rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-in-out font-medium"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          {/* Filters Group */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Filter:</span>

            {/* Role Filter */}
            <select
              value={queryParams.role}
              onChange={(e) => updateQuery({ role: e.target.value })}
              className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
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
              className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Sort:</span>
            <select
              value={`${queryParams.sortBy}-${queryParams.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                updateQuery({
                  sortBy,
                  sortOrder: sortOrder as "asc" | "desc",
                });
              }}
              className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
            >
              <option value="createdAt-desc">Newest Joined</option>
              <option value="createdAt-asc">Oldest Joined</option>
              <option value="reputation-desc">High Reputation</option>
              <option value="reputation-asc">Low Reputation</option>
            </select>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              updateQuery({ page: Math.max(1, queryParams.page - 1) })
            }
            disabled={queryParams.page <= 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-20 text-center">
            Page {queryParams.page} of {totalPages}
          </span>
          <button
            onClick={() =>
              updateQuery({
                page: Math.min(totalPages, queryParams.page + 1),
              })
            }
            disabled={queryParams.page >= totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Screen reader caption */}
            <caption className="sr-only">
              List of users with their roles and status
            </caption>

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
                {/* Actions column */}
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Loading state */}
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center gap-3 text-gray-500">
                      {/* CSS spinner */}
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                /* Empty state */
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="space-y-3">
                      <Users className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No users found
                      </p>
                      <p className="text-sm text-gray-400">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 focus-within:bg-blue-50/30 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-200 transition-colors duration-150"
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
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                          ${
                            user.status === "ACTIVE"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                      >
                        {user.status === "ACTIVE" ? (
                          <ShieldCheck size={14} />
                        ) : (
                          <ShieldAlert size={14} />
                        )}
                        {user.status}
                      </span>
                    </td>
                    {/* Actions column with constrained spread */}
                    <td className="px-3 py-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="p-2.5 bg-gray-50 text-gray-500 border border-gray-200 hover:text-primary-blue hover:bg-emerald-50 hover:border-emerald-50 rounded-full transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-2.5 bg-gray-50 text-gray-500 border border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-50 rounded-full transition-colors hover:cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
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
              {(queryParams.page - 1) * queryParams.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(queryParams.page * queryParams.limit, totalDocs)}
            </span>{" "}
            of <span className="font-medium">{totalDocs}</span> results
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUserToDelete?.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          addAlert("success", "User created successfully");
          refetchUsers();
        }}
      />
    </div>
  );
};

export default AdminUsersPage;
