import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { adminApi } from "@services/admin.api";
import { useAlertStore } from "@stores/useAlertStore";
import PopUpWindow from "@components/ui/PopUpWindow";

interface UpgradeRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    contactEmail?: string;
    rating?: {
      positive: number;
      negative: number;
    };
    rejectedRequestsCount?: number;
  };
  status: "pending" | "approved" | "rejected" | "expired";
  title: string;
  reasons: string;
  createdAt: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  rejectedAt?: string;
}

// Helper function to format relative time
const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

const UpgradeRequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Get initial values from URL or defaults
  const [filter, setFilter] = useState<
    "default" | "pending" | "approved" | "rejected"
  >(
    (searchParams.get("status") as
      | "default"
      | "pending"
      | "approved"
      | "rejected") || "default"
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">(
    (searchParams.get("sort") as "newest" | "oldest") || "newest"
  );

  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(
    null
  );
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addAlert } = useAlertStore();

  // Update URL params whenever filters change
  const updateURLParams = React.useCallback(() => {
    const params = new URLSearchParams();
    if (filter !== "default") params.set("status", filter);
    if (page !== 1) params.set("page", page.toString());
    if (sortBy !== "newest") params.set("sort", sortBy);
    setSearchParams(params, { replace: true });
  }, [filter, page, sortBy, setSearchParams]);

  useEffect(() => {
    updateURLParams();
  }, [updateURLParams]);

  const fetchRequests = React.useCallback(async () => {
    try {
      setLoading(true);
      const statusFilter =
        filter === "default"
          ? undefined
          : (filter as "pending" | "approved" | "rejected");
      const response = await adminApi.getUpgradeRequests(
        page,
        10,
        statusFilter,
        undefined,
        sortBy
      );
      setRequests(response.requests as UpgradeRequest[]);
      setTotalPages(response.pagination.totalPages);
    } catch (error: unknown) {
      addAlert(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to fetch upgrade requests"
      );
    } finally {
      setLoading(false);
    }
  }, [filter, page, sortBy, addAlert]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setIsSubmitting(true);
      await adminApi.approveUpgradeRequest(selectedRequest._id);
      addAlert("success", "Upgrade request approved successfully!");
      setShowApproveModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: unknown) {
      addAlert(
        "error",
        error instanceof Error ? error.message : "Failed to approve request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      addAlert("error", "Please provide a rejection reason");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.rejectUpgradeRequest(selectedRequest._id, rejectionReason);
      addAlert("success", "Upgrade request rejected");
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
    } catch (error: unknown) {
      addAlert(
        "error",
        error instanceof Error ? error.message : "Failed to reject request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Upgrade Requests Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage bidder upgrade requests to become sellers and view request
            history.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Filter:</span>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(
                    e.target.value as
                      | "default"
                      | "pending"
                      | "approved"
                      | "rejected"
                  );
                  setPage(1);
                }}
                className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
              >
                <option value="default">Default (Pending First)</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "newest" | "oldest");
                  setPage(1);
                }}
                className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-600 px-4">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No upgrade requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10">
                          {request.user.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={request.user.avatar}
                              alt={request.user.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                              {request.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {request.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          request.status
                        )}`}
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </span>
                      {request.status === "rejected" &&
                        request.rejectionReason && (
                          <div className="text-xs text-gray-500 mt-1">
                            Reason: {request.rejectionReason}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsModal(true);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PopUpWindow
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedRequest(null);
        }}
        onSubmit={handleApprove}
        title="Approve Upgrade Request"
        submitText="Approve"
        cancelText="Cancel"
        size="md"
        isLoading={isSubmitting}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-800 mb-2">
                <span className="font-semibold">
                  {selectedRequest.user.name}
                </span>{" "}
                will receive a new seller account with:
              </p>
              <ul className="ml-4 text-sm text-blue-700 space-y-1">
                <li>
                  • Email: {selectedRequest.user.email.replace("@", "+seller@")}
                </li>
                <li>• Username: Seller-{selectedRequest.user.name}</li>
                <li>• Same password as bidder account</li>
                <li>• Ability to switch between accounts</li>
              </ul>
            </div>

            <p className="text-center text-gray-600">
              Are you sure you want to proceed?
            </p>
          </div>
        )}
      </PopUpWindow>

      {/* Reject Popup Window */}
      <PopUpWindow
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
          setRejectionReason("");
        }}
        onSubmit={handleReject}
        title="Reject Upgrade Request"
        submitText="Reject"
        cancelText="Cancel"
        size="md"
        isLoading={isSubmitting}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">
                  {selectedRequest.user.name}
                </span>{" "}
                will be notified about this rejection.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Please provide a clear reason for rejection..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
      </PopUpWindow>

      {/* View Details Popup Window */}
      <PopUpWindow
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequest(null);
        }}
        onSubmit={() => {
          if (selectedRequest?.status === "pending") {
            setShowDetailsModal(false);
            setShowApproveModal(true);
          } else {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }
        }}
        onCancel={
          selectedRequest?.status === "pending"
            ? () => {
                setShowDetailsModal(false);
                setShowRejectModal(true);
              }
            : undefined
        }
        title="Request Details"
        submitText={selectedRequest?.status === "pending" ? "Approve" : "Close"}
        cancelText={
          selectedRequest?.status === "pending" ? "Reject" : undefined
        }
        hideCancelButton={selectedRequest?.status !== "pending"}
        submitButtonColor={
          selectedRequest?.status === "pending"
            ? "bg-green-600 hover:bg-green-700"
            : undefined
        }
        cancelButtonColor={
          selectedRequest?.status === "pending"
            ? "text-white bg-red-600 hover:bg-red-700"
            : undefined
        }
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* User Profile Section */}
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                {/* Profile Image */}
                <div className="shrink-0">
                  {selectedRequest.user.avatar ? (
                    <img
                      className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                      src={selectedRequest.user.avatar}
                      alt={selectedRequest.user.name}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-md">
                      {selectedRequest.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {selectedRequest.user.name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="text-gray-600">
                        {selectedRequest.user.email}
                      </span>
                    </div>
                    {selectedRequest.user.contactEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">
                          Contact Email:
                        </span>
                        <span className="text-gray-600">
                          {selectedRequest.user.contactEmail}
                        </span>
                      </div>
                    )}
                    {/* Rating */}
                    {selectedRequest.user.rating && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">
                          Rating:
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold">
                            👍 {selectedRequest.user.rating.positive}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-semibold">
                            👎 {selectedRequest.user.rating.negative}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Rejected Requests Count */}
                    {selectedRequest.user.rejectedRequestsCount !== undefined &&
                      selectedRequest.user.rejectedRequestsCount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700">
                            Previous Rejections:
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-semibold">
                            {selectedRequest.user.rejectedRequestsCount}{" "}
                            rejected request
                            {selectedRequest.user.rejectedRequestsCount > 1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Request Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Request Title
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {selectedRequest.title}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Reasons for Upgrade
              </h4>
              <div className="bg-gray-50 p-5 rounded-lg max-h-[480px] overflow-y-auto overflow-x-hidden border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
                  {selectedRequest.reasons}
                </p>
              </div>
            </div>

            {/* Status Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Request Status
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status.toUpperCase()}
                  </span>
                  <p className="text-xs text-gray-500">
                    Requested {formatTimeAgo(selectedRequest.createdAt)}
                  </p>
                </div>
                {selectedRequest.status === "rejected" &&
                  selectedRequest.rejectionReason && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-600">
                        {selectedRequest.rejectionReason}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </PopUpWindow>
    </div>
  );
};

export default UpgradeRequestsPage;
