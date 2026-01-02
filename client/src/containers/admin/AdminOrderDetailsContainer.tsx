import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { adminApi } from "@services/admin.api";
import type { IOrder, ChatMessage, SimpleUser } from "@interfaces/admin";
import { useAlertStore } from "@stores/useAlertStore";
import { ChevronLeft, Trash2 } from "lucide-react";
import UserProfileSection from "@components/admin/order-details/UserProfileSection";
import OrderMainDetails from "@components/admin/order-details/OrderMainDetails";
import AdminChatBox from "@components/admin/order-details/AdminChatBox";
import Spinner from "@components/ui/Spinner";
import ConfirmationModal from "@components/ui/ConfirmationModal";

const AdminOrderDetailsContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { addAlert } = useAlertStore();

  // Confirmation state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const data = await adminApi.getOrderDetails(id);
        setOrder(data);
      } catch (error: unknown) {
        const msg =
          error instanceof Error
            ? error.message
            : (error as { message?: string })?.message ||
              "Failed to load order";
        addAlert("error", msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, addAlert]);

  const handleChatUpdate = (newChat: { messages: ChatMessage[] }) => {
    if (order) {
      setOrder({ ...order, chat: newChat });
    }
  };

  const handleCancelClick = () => {
    setIsCancelModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!order) return;
    try {
      await adminApi.cancelOrder(order._id);
      addAlert("success", "Order cancelled successfully");
      setOrder({ ...order, status: "CANCELLED" });
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : (error as { message?: string })?.message ||
            "Failed to cancel order";
      addAlert("error", msg);
    } finally {
      setIsCancelModalOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (!order) return;
    try {
      await adminApi.deleteOrder(order._id);
      addAlert("success", "Order deleted successfully");
      navigate("/admin/orders");
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : (error as { message?: string })?.message ||
            "Failed to delete order";
      addAlert("error", msg);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Order not found.</p>
        <Link
          to="/admin/orders"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800">
              Order Details #{order._id}
            </h1>
            <p className="text-sm text-gray-400">
              Created at: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {order.status !== "CANCELLED" && order.status !== "COMPLETED" ? (
          <button
            onClick={handleCancelClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
          >
            <Trash2 size={18} />
            Cancel Order
          </button>
        ) : (
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
          >
            <Trash2 size={18} />
            Delete Order
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UserProfileSection
              user={order.sellerInfo || (order.seller as unknown as SimpleUser)}
              role="Seller"
            />
            <UserProfileSection
              user={order.buyerInfo || (order.buyer as unknown as SimpleUser)}
              role="Bidder"
            />
          </div>

          {/* Order Details */}
          <OrderMainDetails order={order} />
        </div>

        {/* Chat (Right col) */}
        <div className="lg:col-span-1">
          <AdminChatBox
            orderId={order._id}
            initialChat={order.chat}
            onChatUpdate={handleChatUpdate}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        type="danger"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Order"
        message="Are you sure you want to DELETE this order? This will remove the order and its chat history PERMANENTLY. This action cannot be undone."
        confirmText="Yes, DELETE Order"
        type="danger"
      />
    </div>
  );
};

export default AdminOrderDetailsContainer;
