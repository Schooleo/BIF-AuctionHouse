import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { adminApi, adminApiExtended } from "@services/admin.api";
import type {
  UserDetailResponse,
  UserProduct,
  OrdersSummary,
} from "@interfaces/admin";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import BlockReasonModal from "@components/admin/BlockReasonModal";
import Spinner from "@components/ui/Spinner";
import { useAlertStore } from "@stores/useAlertStore";
import AdminReviewCard from "@components/admin/user/AdminReviewCard";
import AdminProductCard from "@components/admin/user/AdminProductCard";
import EditProfileModal from "@components/admin/user/EditProfileModal";
import {
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  MapPin,
  Calendar,
  Mail,
  Package,
  Star,
  ShoppingCart,
  Edit,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  PackageCheck,
} from "lucide-react";
import { StarRating } from "@components/ui/StarRating";

type TabType = "products" | "reviews" | "orders";

const AdminUserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addAlert } = useAlertStore();

  // Main data states
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("products");

  // Profile switching for upgraded accounts
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"seller" | "bidder">("seller");
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

  // Products tab state
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotalPages, setProductsTotalPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Reviews tab pagination
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 10;

  // Orders summary
  const [ordersSummary, setOrdersSummary] = useState<OrdersSummary | null>(
    null
  );
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch main user data
  const fetchUserData = useCallback(
    async (userId: string, page: number = 1) => {
      try {
        const res = await adminApi.getUserDetail(
          userId,
          page,
          REVIEWS_PER_PAGE
        );
        setData(res);
        setCurrentProfileId(userId);
        setCurrentRole(res.profile.role as "seller" | "bidder");
      } catch (error) {
        console.error(error);
        addAlert("error", "Failed to load user details");
      } finally {
        setLoading(false);
      }
    },
    [addAlert]
  );

  // Fetch products
  const fetchProducts = useCallback(
    async (userId: string, role: "seller" | "bidder", page: number = 1) => {
      setLoadingProducts(true);
      try {
        const res = await adminApiExtended.getUserProducts(
          userId,
          role,
          page,
          8
        );
        setProducts(res.products);
        setProductsTotalPages(res.totalPages);
        setProductsPage(res.page);
      } catch (error) {
        console.error(error);
        addAlert("error", "Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    },
    [addAlert]
  );

  // Fetch orders summary
  const fetchOrdersSummary = useCallback(async (userId: string) => {
    setLoadingOrders(true);
    try {
      const res = await adminApiExtended.getUserOrdersSummary(userId);
      setOrdersSummary(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!id) return;
    fetchUserData(id);
  }, [id, fetchUserData]);

  // Fetch products when profile/tab changes
  useEffect(() => {
    if (!currentProfileId || activeTab !== "products") return;
    fetchProducts(currentProfileId, currentRole, 1);
  }, [currentProfileId, currentRole, activeTab, fetchProducts]);

  // Fetch reviews when page changes
  useEffect(() => {
    if (!currentProfileId || activeTab !== "reviews") return;
    fetchUserData(currentProfileId, reviewPage);
  }, [currentProfileId, activeTab, reviewPage, fetchUserData]);

  // Fetch orders when tab changes
  useEffect(() => {
    if (!currentProfileId || activeTab !== "orders") return;
    fetchOrdersSummary(currentProfileId);
  }, [currentProfileId, activeTab, fetchOrdersSummary]);

  // Handle profile switch for upgraded accounts
  const handleProfileSwitch = async () => {
    if (!currentProfileId || !data?.profile.isUpgradedAccount) return;

    setIsSwitchingProfile(true);
    try {
      const linkedData =
        await adminApiExtended.getLinkedProfile(currentProfileId);
      setData(linkedData);
      setCurrentProfileId(linkedData.profile._id);
      setCurrentRole(linkedData.profile.role as "seller" | "bidder");
      setReviewPage(1);
      setProductsPage(1);
    } catch (error: any) {
      addAlert("error", error.message || "Failed to switch profile");
    } finally {
      setIsSwitchingProfile(false);
    }
  };

  // Actions
  const handleBlockUser = async (reason: string) => {
    if (!currentProfileId) return;
    setIsUpdatingStatus(true);
    try {
      await adminApi.blockUser(currentProfileId, reason);
      setData((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                status: "BLOCKED",
                blockReason: reason,
              },
            }
          : null
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
    if (!currentProfileId) return;
    setIsUpdatingStatus(true);
    try {
      await adminApi.unblockUser(currentProfileId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                status: "ACTIVE",
                blockReason: undefined,
              },
            }
          : null
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
    if (!currentProfileId) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(currentProfileId);
      addAlert("success", "User deleted successfully");
      navigate("/admin/users");
    } catch (error: any) {
      addAlert("error", error.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleUpdateProfile = async (profileData: any) => {
    if (!currentProfileId) return;
    await adminApi.updateUser(currentProfileId, profileData);
    // Refresh data
    await fetchUserData(currentProfileId, reviewPage);
    addAlert("success", "Profile updated successfully");
  };

  // Review handlers
  const handleEditReview = async (reviewId: string, newComment: string) => {
    await adminApiExtended.updateReview(reviewId, newComment);
    // Refresh reviews
    if (currentProfileId) {
      await fetchUserData(currentProfileId, reviewPage);
    }
    addAlert("success", "Review updated");
  };

  const handleDeleteReview = async (reviewId: string) => {
    await adminApiExtended.deleteReview(reviewId);
    // Refresh reviews
    if (currentProfileId) {
      await fetchUserData(currentProfileId, reviewPage);
    }
    addAlert("success", "Review deleted");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Spinner />
      </div>
    );
  }

  if (!data) return <div className="text-center p-10">User not found.</div>;

  const { profile, reviews, stats } = data;

  // Order status config - clean unified theme
  const orderStatusConfig = [
    {
      key: "PENDING_PAYMENT",
      label: "Pending Payment",
      icon: CreditCard,
      iconColor: "text-amber-500",
      countColor: "text-gray-800",
    },
    {
      key: "PAID_CONFIRMED",
      label: "Paid",
      icon: CheckCircle,
      iconColor: "text-primary-blue",
      countColor: "text-gray-800",
    },
    {
      key: "SHIPPED",
      label: "Shipped",
      icon: Truck,
      iconColor: "text-primary-blue",
      countColor: "text-gray-800",
    },
    {
      key: "RECEIVED",
      label: "Received",
      icon: PackageCheck,
      iconColor: "text-primary-blue",
      countColor: "text-gray-800",
    },
    {
      key: "COMPLETED",
      label: "Completed",
      icon: CheckCircle,
      iconColor: "text-green-500",
      countColor: "text-green-600",
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      icon: XCircle,
      iconColor: "text-red-500",
      countColor: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/users"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800">User Details</h1>
            <p className="text-sm text-gray-500 mt-1">
              {profile.name} •{" "}
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </p>
          </div>
        </div>

        {/* Switch Profile Button - only for upgraded accounts */}
        {profile.isUpgradedAccount && (
          <button
            onClick={handleProfileSwitch}
            disabled={isSwitchingProfile}
            className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2.5 rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-in-out font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftRight size={18} />
            {isSwitchingProfile
              ? "Switching..."
              : `Switch to ${currentRole === "seller" ? "Bidder" : "Seller"} Profile`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            {/* Avatar & Basic Info */}
            <div className="p-6 flex flex-col items-center text-center border-b border-gray-100">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-3xl font-bold mb-4 overflow-hidden border-4 border-white shadow-sm ring-1 ring-gray-100">
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

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {profile.name}
              </h2>

              {/* Role & Status Badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold uppercase text-gray-600">
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

              {/* Rating */}
              <div className="flex flex-col items-center gap-2">
                <StarRating rating={profile.starRating} size="lg" />
                <span className="text-sm text-gray-500">
                  ({profile.ratingCount} reviews)
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <ThumbsUp size={16} className="text-green-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {stats.positiveCount}
                    </div>
                    <div className="text-xs text-gray-500">Positive</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <ThumbsDown size={16} className="text-red-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {stats.negativeCount}
                    </div>
                    <div className="text-xs text-gray-500">Negative</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="text-gray-400 mt-0.5" size={16} />
                <div>
                  <span className="block text-xs text-gray-500 uppercase font-semibold">
                    Email
                  </span>
                  <span className="text-gray-900 text-sm break-all">
                    {profile.email}
                  </span>
                  {profile.contactEmail && (
                    <span className="block text-gray-500 text-xs mt-0.5">
                      {profile.contactEmail}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-0.5" size={16} />
                <div>
                  <span className="block text-xs text-gray-500 uppercase font-semibold">
                    Address
                  </span>
                  <span className="text-gray-900 text-sm">
                    {profile.address || "Not provided"}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-0.5" size={16} />
                <div>
                  <span className="block text-xs text-gray-500 uppercase font-semibold">
                    Joined
                  </span>
                  <span className="text-gray-900 text-sm">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-3">
              {/* Block Reason */}
              {profile.status === "BLOCKED" && profile.blockReason && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 uppercase mb-1">
                    Block Reason:
                  </p>
                  <p className="text-sm text-red-600">{profile.blockReason}</p>
                </div>
              )}

              {profile.role !== "admin" && (
                <>
                  {/* Edit Button */}
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm bg-primary-blue text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
                  >
                    <Edit size={16} /> Edit Profile
                  </button>

                  {/* Block/Unblock */}
                  <button
                    onClick={() =>
                      profile.status === "ACTIVE"
                        ? setIsBlockModalOpen(true)
                        : setIsUnblockModalOpen(true)
                    }
                    disabled={isUpdatingStatus}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all border ${
                      profile.status === "ACTIVE"
                        ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-orange-600"
                        : "bg-green-600 border-transparent text-white hover:bg-green-700"
                    } ${isUpdatingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {profile.status === "ACTIVE"
                      ? "Block Account"
                      : "Unblock Account"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
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
                onClick={() => setActiveTab("products")}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "products"
                    ? "border-primary-blue text-primary-blue bg-blue-50/30"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Package size={18} /> Products
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "reviews"
                    ? "border-primary-blue text-primary-blue bg-blue-50/30"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Star size={18} /> Reviews ({reviews.totalDocs})
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "orders"
                    ? "border-primary-blue text-primary-blue bg-blue-50/30"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ShoppingCart size={18} /> Orders
              </button>
            </div>

            <div className="p-6">
              {/* Products Tab */}
              {activeTab === "products" && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    {currentRole === "seller"
                      ? "Products listed by this user"
                      : "Auctions this user has participated in"}
                  </p>

                  {loadingProducts ? (
                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Package size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No products found.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                          <AdminProductCard
                            key={product._id}
                            product={product}
                            viewMode={currentRole}
                          />
                        ))}
                      </div>

                      {/* Pagination */}
                      {productsTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                          <button
                            onClick={() => {
                              setProductsPage((p) => Math.max(1, p - 1));
                              if (currentProfileId)
                                fetchProducts(
                                  currentProfileId,
                                  currentRole,
                                  productsPage - 1
                                );
                            }}
                            disabled={productsPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <ChevronLeft size={16} /> Previous
                          </button>
                          <span className="px-4 py-2 text-sm text-gray-600">
                            Page {productsPage} / {productsTotalPages}
                          </span>
                          <button
                            onClick={() => {
                              setProductsPage((p) =>
                                Math.min(productsTotalPages, p + 1)
                              );
                              if (currentProfileId)
                                fetchProducts(
                                  currentProfileId,
                                  currentRole,
                                  productsPage + 1
                                );
                            }}
                            disabled={productsPage === productsTotalPages}
                            className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            Next <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Reviews received by this user
                  </p>

                  {reviews.docs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Star size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No reviews yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {reviews.docs
                          .filter((review) => review.rater)
                          .map((review) => (
                            <AdminReviewCard
                              key={review._id}
                              review={review}
                              onEdit={handleEditReview}
                              onDelete={handleDeleteReview}
                            />
                          ))}
                      </div>

                      {/* Pagination */}
                      {reviews.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                          <button
                            onClick={() =>
                              setReviewPage((p) => Math.max(1, p - 1))
                            }
                            disabled={reviewPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <ChevronLeft size={16} /> Previous
                          </button>
                          <span className="px-4 py-2 text-sm text-gray-600">
                            Page {reviews.page} / {reviews.totalPages}
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
                            Next <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Orders summary (
                    {currentRole === "seller" ? "as seller" : "as buyer"})
                  </p>

                  {loadingOrders ? (
                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>
                  ) : !ordersSummary ? (
                    <div className="text-center py-12 text-gray-400">
                      <ShoppingCart
                        size={48}
                        className="mx-auto mb-4 opacity-50"
                      />
                      <p>No orders data.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {orderStatusConfig.map((status) => {
                        const Icon = status.icon;
                        const count =
                          ordersSummary.summary[
                            status.key as keyof typeof ordersSummary.summary
                          ] || 0;
                        return (
                          <div
                            key={status.key}
                            className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow flex items-center gap-3"
                          >
                            <div className={`p-2.5 rounded-lg bg-gray-50`}>
                              <Icon size={20} className={status.iconColor} />
                            </div>
                            <div>
                              <div
                                className={`text-2xl font-bold ${status.countColor}`}
                              >
                                {count}
                              </div>
                              <div className="text-xs text-gray-500">
                                {status.label}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Total */}
                      <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 flex items-center gap-3 col-span-2 md:col-span-3">
                        <div className="p-2 rounded-full bg-gray-100">
                          <Clock size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {ordersSummary.total}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total Orders
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BlockReasonModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={handleBlockUser}
        userName={profile.name}
        isLoading={isUpdatingStatus}
      />

      <ConfirmationModal
        isOpen={isUnblockModalOpen}
        onClose={() => setIsUnblockModalOpen(false)}
        onConfirm={handleUnblockUser}
        title="Unblock User"
        message={`Are you sure you want to unblock "${profile.name}"? They will be able to access their account again.`}
        confirmText={isUpdatingStatus ? "Processing..." : "Unblock"}
        type="success"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${profile.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        type="danger"
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateProfile}
        initialData={{
          name: profile.name,
          email: profile.email,
          address: profile.address,
          contactEmail: profile.contactEmail,
          dateOfBirth: (profile as any).dateOfBirth,
        }}
      />
    </div>
  );
};

export default AdminUserDetailsPage;
