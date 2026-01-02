import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Edit2,
  Clock,
  Trash2,
  Calendar,
  Package,
  User,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Truck,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { adminApi, type AdminProductDetails } from "@services/admin.api";
import type { Product } from "@interfaces/product";
import { useAlertStore } from "@stores/useAlertStore";
import Spinner from "@components/ui/Spinner";
import ErrorMessage from "@components/message/ErrorMessage";
import ProductImageCard from "@components/product/ProductImageCard";
import AdminProductEditModal from "@components/admin/ProductEditModal";
import ConfirmationModal from "@components/ui/ConfirmationModal";
import PopUpWindow from "@components/ui/PopUpWindow";
import AdminBidHistoryModal from "@components/admin/AdminBidHistoryModal";
import { formatPrice } from "@utils/product";
import { formatDateTime, getTimeRemaining } from "@utils/time";
import DOMPurify from "dompurify";

interface AdminProductDetailsContainerProps {
  id: string;
}

const AdminProductDetailsContainer: React.FC<
  AdminProductDetailsContainerProps
> = ({ id }) => {
  const navigate = useNavigate();
  const addAlert = useAlertStore((state) => state.addAlert);

  const [details, setDetails] = useState<AdminProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; question: string } | null>(null); // Add this

  const [newEndTime, setNewEndTime] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getProductDetails(id);
      setDetails(data);
    } catch (err: any) {
      setError(err.message || "Failed to load product details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Scroll to top immediately when product changes
    window.scrollTo(0, 0);
    fetchDetails();
  }, [id, fetchDetails]);

  const handleUpdateProduct = async (updateData: any) => {
    try {
      setActionLoading(true);
      await adminApi.updateProduct(id, updateData);
      addAlert("success", "Product updated successfully");
      await fetchDetails();
    } catch (err: any) {
      addAlert("error", err.message || "Failed to update product");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendEndTime = async () => {
    if (!newEndTime) {
      addAlert("error", "Please select a new end time");
      return;
    }

    try {
      setActionLoading(true);
      // Convert to ISO string format
      const endTimeISO = new Date(newEndTime).toISOString();
      await adminApi.extendProductEndTime(id, endTimeISO);
      addAlert("success", "End time extended successfully");
      setIsExtendModalOpen(false);
      setNewEndTime("");
      await fetchDetails();
    } catch (err: any) {
      addAlert("error", err.message || "Failed to extend end time");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      setActionLoading(true);
      await adminApi.deleteProduct(id);
      addAlert("success", "Product and all associated data deleted successfully");
      navigate("/admin/products/active");
    } catch (err: any) {
      addAlert("error", err.message || "Failed to delete product");
    } finally {
      setActionLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      setActionLoading(true);
      await adminApi.deleteProductQuestion(id, questionToDelete.id);
      addAlert("success", "Question deleted successfully");
      setQuestionToDelete(null);
      await fetchDetails();
    } catch (err: any) {
      addAlert("error", err.message || "Failed to delete question");
    } finally {
      setActionLoading(false);
    }
  };

  // Computed values (must be before conditional returns)
  const product = details?.product;
  const bidHistory = details?.bidHistory || [];
  const isEnded = details?.isEnded || false;
  const order = details?.order;
  const hasActiveBids = (product?.bidCount || 0) > 0;
  const timeRemaining = product ? getTimeRemaining(product.endTime) : { text: "", isEnded: true, isUrgent: false };
  
  const allImages = useMemo(() => {
    if (!product) return [];
    return [
      product.mainImage,
      ...(product.subImages || []),
    ].filter(Boolean) as string[];
  }, [product]);

  const sanitizedDescription = useMemo(() => {
    if (!product) return "";
    return DOMPurify.sanitize(product.description);
  }, [product]);

  const categoryName = useMemo(() => {
    if (!product) return "Unknown";
    return typeof product.category === "string"
      ? product.category
      : product.category?.name || "Unknown";
  }, [product]);

  const sellerName = useMemo(() => {
    if (!product) return "Unknown";
    return typeof product.seller === "object" ? product.seller.name : "Unknown";
  }, [product]);

  const currentBidderName = useMemo(() => {
    if (!product) return "No bids yet";
    return typeof product.currentBidder === "object"
      ? product.currentBidder?.name
      : "No bids yet";
  }, [product]);

  const currentBidderId = useMemo(() => {
    if (!product) return undefined;
    return typeof product.currentBidder === "object"
      ? product.currentBidder?._id
      : undefined;
  }, [product]);

  const canDelete = true; // Always allow delete, but show warnings
  const canExtend = !isEnded || (!product?.winnerConfirmed && hasActiveBids);

  // Get delete warning message
  const getDeleteWarningMessage = () => {
    if (!product) return "Are you sure you want to delete this product?";
    
    const warnings: string[] = [];
    
    if (!isEnded) {
      warnings.push("This product is still active and the auction is ongoing.");
    }
    
    if (hasActiveBids) {
      warnings.push(`This product has ${product.bidCount} bid(s) placed.`);
    }
    
    if (order) {
      const orderStatus = order.status.replace(/_/g, " ");
      warnings.push(`This product is currently in the ordering process (Status: ${orderStatus}).`);
    }

    if (warnings.length === 0) {
      return "Are you sure you want to delete this product? This action cannot be undone.";
    }

    return `${warnings.join("\n\n")} This will also remove all associated bids, auto-bids, watchlist entries${order ? ", and cancel the order" : ""}. This action cannot be undone. Are you sure you want to proceed?`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error || !details || !product) {
    return (
      <div className="py-16">
        <ErrorMessage text={error || "Product not found"} />
      </div>
    );
  }

  const getStatusBadge = () => {
    if (order) {
      const statusColors: Record<string, string> = {
        PENDING_PAYMENT: "bg-yellow-100 text-yellow-800 border-yellow-300",
        PAID_CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
        SHIPPED: "bg-purple-100 text-purple-800 border-purple-300",
        RECEIVED: "bg-green-100 text-green-800 border-green-300",
        COMPLETED: "bg-green-100 text-green-800 border-green-300",
        CANCELLED: "bg-red-100 text-red-800 border-red-300",
      };
      
      const getStatusIcon = () => {
        switch (order.status) {
          case "PENDING_PAYMENT":
            return <CreditCard className="w-4 h-4" />;
          case "PAID_CONFIRMED":
            return <CheckCircle className="w-4 h-4" />;
          case "SHIPPED":
            return <Truck className="w-4 h-4" />;
          case "RECEIVED":
          case "COMPLETED":
            return <CheckCircle className="w-4 h-4" />;
          case "CANCELLED":
            return <AlertCircle className="w-4 h-4" />;
          default:
            return <ShoppingBag className="w-4 h-4" />;
        }
      };

      return (
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${
            statusColors[order.status] || "bg-gray-100 text-gray-800 border-gray-300"
          }`}
        >
          {getStatusIcon()}
          {order.status.replace(/_/g, " ")}
        </span>
      );
    }

    if (isEnded) {
      if (product.transactionCompleted) {
        return (
          <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Transaction Completed
          </span>
        );
      }
      if (product.winnerConfirmed) {
        return (
          <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            In Transaction
          </span>
        );
      }
      if (hasActiveBids) {
        return (
          <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Awaiting Confirmation
          </span>
        );
      }
      return (
        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Ended - No Bids
        </span>
      );
    }

    return (
      <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300 flex items-center gap-2">
        <CheckCircle className="w-4 h-4" />
        Active Auction
      </span>
    );
  };

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 md:px-0">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Left: Static Images */}
          <div className="w-full md:w-5/12 shrink-0">
            <ProductImageCard images={allImages} recentlyAdded={false} />
          </div>

          {/* Right: Product Info */}
          <div className="flex-1 space-y-4">
            {/* Product Title and Status */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.name}
                </h1>
                {getStatusBadge()}
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">Category:</span>
                  <span>{categoryName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Seller:</span>
                  <span>{sellerName}</span>
                </div>
              </div>
            </div>

            {/* Auction Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Auction Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Starts:</span>
                  <span className="font-medium text-gray-900">
                    {formatDateTime(product.startTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Ends:</span>
                  <span className="font-medium text-gray-900">
                    {formatDateTime(product.endTime)}
                  </span>
                </div>
              </div>

              {!isEnded && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Time Remaining:</span>
                    <span className="text-lg font-bold">{timeRemaining.text}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Info */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Current Price
              </h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-green-600">
                  {formatPrice(product.currentPrice)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Starting Price</p>
                  <p className="font-semibold text-gray-900">
                    {formatPrice(product.startingPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Step Price</p>
                  <p className="font-semibold text-gray-900">
                    {formatPrice(product.stepPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Buy Now</p>
                  <p className="font-semibold text-blue-600">
                    {product.buyNowPrice ? formatPrice(product.buyNowPrice) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bidding Info */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                {product?.winnerConfirmed ? "Confirmed Winner" : "Highest Bidder"}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {currentBidderName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {typeof product.currentBidder === "object" && product.currentBidder?.rating
                        ? `⭐ ${product.currentBidder.rating.toFixed(1)}`
                        : "No rating"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBidHistoryOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View Bid History
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    {product.bidCount}
                  </span>
                </button>
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.autoExtends
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {product.autoExtends ? "✓" : "✗"} Auto-extend
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.allowUnratedBidders
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {product.allowUnratedBidders ? "✓" : "✗"} Unrated bidders
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition font-medium"
              >
                <Edit2 className="w-5 h-5" />
                Edit Product
              </button>

              {canExtend && (
                <button
                  onClick={() => setIsExtendModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <Clock className="w-5 h-5" />
                  Extend Time
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Product
                </button>
              )}
            </div>

            {/* Transaction Details (if order exists) */}
            {order && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Transaction Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium font-mono text-xs">{order._id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Buyer:</span>
                    <span className="font-medium">
                      {order.buyer && typeof order.buyer === "object"
                        ? order.buyer.name
                        : "Unknown"}
                    </span>
                  </div>
                  {order.shippingAddress && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium text-right max-w-[200px]">
                        {order.shippingAddress}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description Section - Full Width Below */}
        <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />

          {product.descriptionHistory &&
            product.descriptionHistory.length > 0 && (
              <details className="mt-6">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  View Description History ({product.descriptionHistory.length})
                </summary>
                <div className="mt-4 space-y-4">
                  {product.descriptionHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-gray-200 pl-4 py-2"
                    >
                      <p className="text-xs text-gray-500 mb-2">
                        Updated: {formatDateTime(entry.updatedAt)}
                      </p>
                      <div
                        className="prose prose-sm"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(entry.content),
                        }}
                      />
                    </div>
                  ))}
                </div>
              </details>
            )}
        </div>

        {/* Q&A Section */}
        <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Questions & Answers ({product.questions?.length || 0})
          </h2>
          {!product.questions || product.questions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No questions yet</p>
          ) : (
            <div className="space-y-4">
              {product.questions.map((qa) => (
                <div
                  key={qa._id}
                  className="border-l-4 border-blue-500 pl-4 py-2 relative group"
                >
                  {/* Delete Button */}
                  <button
                    onClick={() =>
                      setQuestionToDelete({
                        id: qa._id,
                        question: qa.question,
                      })
                    }
                    className="absolute -right-2 -top-2 p-2 bg-red-50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 shadow-sm border border-red-200"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="mb-2">
                    <p className="font-medium text-gray-900">
                      Q: {qa.question}
                    </p>
                    <p className="text-xs text-gray-500">
                      Asked by{" "}
                      {typeof qa.questioner === "object"
                        ? qa.questioner.name
                        : "Unknown"}{" "}
                      on {formatDateTime(qa.askedAt)}
                    </p>
                  </div>
                  {qa.answer ? (
                    <div>
                      <p className="text-gray-700">A: {qa.answer}</p>
                      <p className="text-xs text-gray-500">
                        Answered on {formatDateTime(qa.answeredAt!)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Not answered yet</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AdminProductEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
        onSubmit={handleUpdateProduct}
        hasActiveBids={hasActiveBids}
      />

      <AdminBidHistoryModal
        isOpen={isBidHistoryOpen}
        onClose={() => setIsBidHistoryOpen(false)}
        bidHistory={bidHistory}
        currentBidderId={currentBidderId}
        winnerConfirmed={Boolean(product.winnerConfirmed)}
      />

      <PopUpWindow
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        title="Extend Auction End Time"
        submitText="Extend"
        onSubmit={handleExtendEndTime}
        isLoading={actionLoading}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Current end time: <strong>{formatDateTime(product.endTime)}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New End Time
            </label>
            <input
              type="datetime-local"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              min={new Date(
                new Date(product.endTime).getTime() + 60000
              ).toISOString().slice(0, 16)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            />
          </div>
        </div>
      </PopUpWindow>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={getDeleteWarningMessage()}
        confirmText="Delete"
        type="danger"
      />

      {/* Question Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={handleDeleteQuestion}
        title="Delete Question"
        message={`Are you sure you want to delete this question?\n\n"${questionToDelete?.question}"\n\nThis action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default AdminProductDetailsContainer;