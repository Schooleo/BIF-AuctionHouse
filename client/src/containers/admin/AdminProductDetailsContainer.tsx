import React, { useEffect, useState, useCallback } from "react";
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
    fetchDetails();
  }, [fetchDetails]);

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
      addAlert("success", "Product deleted successfully");
      navigate("/admin/products/active");
    } catch (err: any) {
      addAlert("error", err.message || "Failed to delete product");
    } finally {
      setActionLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="py-16">
        <ErrorMessage text={error || "Product not found"} />
      </div>
    );
  }

  const { product, bidHistory, isEnded, order } = details;
  const hasActiveBids = product.bidCount > 0;
  const timeRemaining = getTimeRemaining(product.endTime);

  const allImages = [
    product.mainImage,
    ...(product.subImages || []),
  ].filter(Boolean) as string[];

  const sanitizedDescription = DOMPurify.sanitize(product.description);

  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || "Unknown";

  const sellerName =
    typeof product.seller === "object" ? product.seller.name : "Unknown";

  const currentBidderName =
    typeof product.currentBidder === "object"
      ? product.currentBidder?.name
      : "No bids yet";

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

  const canExtend = !isEnded || (!product.winnerConfirmed && hasActiveBids);
  const canDelete = !hasActiveBids && !order;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {getStatusBadge()}
          
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-dark transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit Product
          </button>

          {canExtend && (
            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Clock className="w-4 h-4" />
              Extend Time
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-0">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Left: Images - Now static with fixed width */}
          <div className="w-full md:w-5/12 shrink-0">
            <ProductImageCard images={allImages} recentlyAdded={false} />
          </div>

          {/* Right: Product Summary */}
          <div className="flex-1 space-y-6">
            {/* Product Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">Category:</span>
                  <span>{categoryName}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-5 h-5" />
                  <span className="font-medium">Seller:</span>
                  <span>{sellerName}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Start:</span>
                  <span className="text-sm">{formatDateTime(product.startTime)}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">End:</span>
                  <span className="text-sm">{formatDateTime(product.endTime)}</span>
                </div>
              </div>

              {!isEnded && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Time Remaining:</span>
                    <span className="text-lg font-bold">{timeRemaining.text}</span>
                  </div>
                </div>
              )}

              {/* Pricing Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Starting Price</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(product.startingPrice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Current Price</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(product.currentPrice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Step Price</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(product.stepPrice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Buy Now</p>
                  <p className="text-lg font-bold text-blue-600">
                    {product.buyNowPrice
                      ? formatPrice(product.buyNowPrice)
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Bid Stats */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Bids</p>
                    <p className="text-xl font-bold text-gray-900">
                      {product.bidCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Current Bidder</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {currentBidderName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="mt-4 flex gap-4 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    product.autoExtends
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {product.autoExtends ? "✓" : "✗"} Auto-extend
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    product.allowUnratedBidders
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {product.allowUnratedBidders ? "✓" : "✗"} Unrated bidders
                </span>
              </div>
            </div>

            {/* Order Info (if exists) */}
            {order && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Transaction Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium font-mono text-sm">{order._id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Buyer:</span>
                    <span className="font-medium">
                      {order.buyer && typeof order.buyer === "object"
                        ? order.buyer.name
                        : "Unknown"}
                    </span>
                  </div>
                  {order.shippingAddress && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-gray-600">Shipping Address:</span>
                      <span className="font-medium text-right max-w-xs">
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

        {/* Bid History */}
        <div className="mt-10 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Bid History ({bidHistory.length})
          </h2>
          {bidHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bids yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bidHistory.map((bid) => (
                <div
                  key={bid._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {bid.bidder.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Rating: {bid.bidder.rating?.toFixed(1) || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatPrice(bid.price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(bid.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
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
        message="Are you sure you want to delete this product? This will also remove all associated bids, auto-bids, and watchlist entries. This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default AdminProductDetailsContainer;