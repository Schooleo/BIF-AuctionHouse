import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi, type UserDetailResponse } from "../../services/admin.api";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import BlockReasonModal from "../../components/admin/BlockReasonModal";
import Spinner from "../../components/ui/Spinner";
import { useAlertStore } from "../../stores/useAlertStore";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Clock,
  MapPin,
  Calendar,
  Mail,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StarRating } from "../../components/ui/StarRating";

type TabType = "activity" | "selling";

const AdminUserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("activity");

  // Pagination state for reviews
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 10;

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Block/Unblock State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { addAlert } = useAlertStore();

  // Fetch Data
  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await adminApi.getUserDetail(
          id,
          reviewPage,
          REVIEWS_PER_PAGE
        );
        setData(res);
      } catch (error) {
        console.error(error);
        addAlert("error", "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, reviewPage]); // Re-fetch when page changes

  // Actions
  const handleBlockUser = async (reason: string) => {
    if (!id) return;
    setIsUpdatingStatus(true);
    try {
      await adminApi.blockUser(id, reason);
      setData((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, status: "BLOCKED", blockReason: reason } } : null
      );
      addAlert("success", "User blocked successfully");
      setIsBlockModalOpen(false);
    } catch (error: any) {
      addAlert("error", error.message || "Failed to block user");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!id) return;
    setIsUpdatingStatus(true);
    try {
      await adminApi.unblockUser(id);
      setData((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, status: "ACTIVE", blockReason: undefined } } : null
      );
      addAlert("success", "User unblocked successfully");
      setIsUnblockModalOpen(false);
    } catch (error: any) {
      addAlert("error", error.message || "Failed to unblock user");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(id);
      addAlert("success", "User deleted successfully");
      navigate("/admin/users");
    } catch (error: any) {
      addAlert("error", error.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Spinner />
      </div>
    );
  }

  if (!data) return <div className="text-center p-10">User not found.</div>;

  const { profile, bidHistory, sellingHistory, reviews, stats } = data;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header / Back */}
      <div>
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-gray-500 hover:text-primary-blue transition-colors mb-4 group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to Users
        </button>
        <h1 className="text-2xl font-bold text-gray-800">User Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            {/* Top Section */}
            <div className="p-8 flex flex-col items-center text-center border-b border-gray-100">
              <div className="w-32 h-32 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue text-4xl font-bold mb-4 overflow-hidden border-4 border-white shadow-sm ring-1 ring-gray-100">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {profile.name}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold uppercase text-gray-600 tracking-wide">
                  {profile.role}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1 ${
                    profile.status === "ACTIVE"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {profile.status === "ACTIVE" ? (
                    <>
                      <ShieldCheck size={12} /> Active
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={12} /> Blocked
                    </>
                  )}
                </span>
              </div>

              {/* Stats Row with Star Rating */}
              <div className="flex flex-col items-center gap-4 w-full mt-4">
                <div className="flex flex-col items-center">
                  <StarRating rating={profile.starRating} size="lg" />
                  <span className="text-sm text-gray-500 mt-2">
                    ({profile.ratingCount} reviews)
                  </span>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-primary-blue">
                      {bidHistory.length}
                    </div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">
                      Bids
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-600">
                      {stats.positiveCount} 👍 / {stats.negativeCount} 👎
                    </div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">
                      Breakdown
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <span className="block text-xs text-gray-500 uppercase font-bold">
                    Email
                  </span>
                  <span className="text-gray-900 text-sm break-all">
                    {profile.email}
                  </span>
                  {profile.contactEmail && (
                    <span className="block text-gray-500 text-xs mt-1">
                      {profile.contactEmail}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <span className="block text-xs text-gray-500 uppercase font-bold">
                    Address
                  </span>
                  <span className="text-gray-900 text-sm">
                    {profile.address || "No address provided"}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-0.5" size={18} />
                <div>
                  <span className="block text-xs text-gray-500 uppercase font-bold">
                    Joined
                  </span>
                  <span className="text-gray-900 text-sm">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
              {/* Block Reason Display */}
              {profile.status === "BLOCKED" && profile.blockReason && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 uppercase mb-1">Block Reason:</p>
                  <p className="text-sm text-red-600">{profile.blockReason}</p>
                </div>
              )}
              
              {profile.role !== "admin" && (
                <>
                  <button
                    onClick={() => profile.status === "ACTIVE" ? setIsBlockModalOpen(true) : setIsUnblockModalOpen(true)}
                    disabled={isUpdatingStatus}
                    className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all border shadow-sm ${
                      profile.status === "ACTIVE"
                        ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600"
                        : "bg-green-600 border-transparent text-white hover:bg-green-700"
                    } ${isUpdatingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {profile.status === "ACTIVE"
                      ? "Block Access"
                      : "Unblock User"}
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full py-2.5 rounded-lg font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Delete Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabs & Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden min-h-[500px]">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "activity"
                    ? "border-primary-blue text-primary-blue bg-blue-50/30"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <MoreHorizontal size={18} /> Activity Overview
              </button>
              {profile.role === "seller" && (
                <button
                  onClick={() => setActiveTab("selling")}
                  className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${
                    activeTab === "selling"
                      ? "border-primary-blue text-primary-blue bg-blue-50/30"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Selling History
                </button>
              )}
            </div>

            <div className="p-6">
              {/* Tab 1: Activity Overview */}
              {activeTab === "activity" && (
                <div className="space-y-8">
                  {/* Mini-table: Recent Bids */}
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary-blue rounded-full"></span>{" "}
                      Recent Bids
                    </h3>
                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs tracking-wider">
                          <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bidHistory.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="p-6 text-center text-gray-400 italic"
                              >
                                No recent activity.
                              </td>
                            </tr>
                          ) : (
                            bidHistory.slice(0, 5).map(
                              (
                                bid // Limit to 5 just in case
                              ) => (
                                <tr
                                  key={bid._id}
                                  className="hover:bg-gray-50/50"
                                >
                                  <td className="p-3 font-medium text-gray-900">
                                    {bid.productName}
                                  </td>
                                  <td className="p-3 font-mono text-gray-600">
                                    ${bid.amount.toLocaleString()}
                                  </td>
                                  <td className="p-3 text-gray-500">
                                    {new Date(bid.date).toLocaleDateString()}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                        bid.status === "Won"
                                          ? "bg-green-100 text-green-800"
                                          : bid.status === "Lost"
                                            ? "bg-gray-100 text-gray-600"
                                            : bid.status === "Leading"
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {bid.status}
                                    </span>
                                  </td>
                                </tr>
                              )
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Mini-section: Recent Ratings with Binary Icons */}
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>{" "}
                      Recent Reviews
                    </h3>
                    {reviews.docs.length === 0 ? (
                      <p className="text-gray-400 italic text-sm p-4 border border-dashed rounded-lg text-center">
                        No reviews yet.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {reviews.docs.map((review) => (
                            <div
                              key={review._id}
                              className={`flex gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow ${
                                review.score < 0
                                  ? "bg-red-50 border-red-200"
                                  : "border-gray-100"
                              }`}
                            >
                              {/* Icon */}
                              <div className="shrink-0">
                                {review.score > 0 ? (
                                  <ThumbsUp
                                    size={20}
                                    className="text-green-600"
                                  />
                                ) : (
                                  <ThumbsDown
                                    size={20}
                                    className="text-red-600"
                                  />
                                )}
                              </div>

                              {/* Avatar & Content */}
                              <div className="shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                  {review.rater.avatar ? (
                                    <img
                                      src={review.rater.avatar}
                                      alt={review.rater.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-gray-500 font-bold text-xs">
                                      {review.rater.name
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <span className="font-bold text-gray-900 text-sm">
                                      {review.rater.name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {new Date(
                                        review.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  "{review.comment}"
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination Controls */}
                        {reviews.totalPages > 1 && (
                          <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                              onClick={() =>
                                setReviewPage((p) => Math.max(1, p - 1))
                              }
                              disabled={reviewPage === 1}
                              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <ChevronLeft size={16} />
                              Previous
                            </button>

                            <span className="px-4 py-2 text-sm text-gray-600">
                              Page {reviews.page} of {reviews.totalPages}
                            </span>

                            <button
                              onClick={() =>
                                setReviewPage((p) =>
                                  Math.min(reviews.totalPages, p + 1)
                                )
                              }
                              disabled={reviewPage === reviews.totalPages}
                              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              Next
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                </div>
              )}

              {/* Tab 2: Selling */}
              {activeTab === "selling" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellingHistory.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-400">
                      <p>No active listings found.</p>
                    </div>
                  ) : (
                    sellingHistory.map((prod) => (
                      <div
                        key={prod._id}
                        className="flex flex-col group border border-gray-100 rounded-lg hover:border-primary-blue/30 hover:shadow-md transition-all"
                      >
                        <div className="relative h-40 w-full bg-gray-100 rounded-t-lg overflow-hidden">
                          <img
                            src={prod.mainImage}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            {prod.bidCount} Bids
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <h4 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-primary-blue">
                            {prod.name}
                          </h4>
                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-primary-blue font-bold">
                              ${prod.currentPrice.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />{" "}
                              {new Date(prod.endTime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Block User Modal */}
      <BlockReasonModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={handleBlockUser}
        userName={profile.name}
        isLoading={isUpdatingStatus}
      />

      {/* Unblock User Modal */}
      <ConfirmationModal
        isOpen={isUnblockModalOpen}
        onClose={() => setIsUnblockModalOpen(false)}
        onConfirm={handleUnblockUser}
        title="Unblock User"
        message={`Are you sure you want to unblock "${profile.name}"? They will be able to access their account again.`}
        confirmText={isUpdatingStatus ? "Unblocking..." : "Unblock"}
        type="primary"
      />

      {/* Delete User Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${profile.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        type="danger"
      />
    </div>
  );
};

export default AdminUserDetailsPage;
