import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { adminApi } from "@services/admin.api";
import type { IOrder } from "@interfaces/admin";
import OrderCard from "@components/admin/OrderCard";
import { useAlertStore } from "@stores/useAlertStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Spinner from "@components/ui/Spinner";
import ConfirmationModal from "@components/ui/ConfirmationModal";

const ADMIN_ORDER_STATUSES = [
  { value: "ongoing", label: "Ongoing" },
  { value: "all", label: "All Orders" },
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PAID_CONFIRMED", label: "Paid & Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const ADMIN_ORDER_SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "price_asc", label: "Price: Low to High" },
];

const AdminOrdersContainer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const { addAlert } = useAlertStore();

  // Confirmation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // Params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "8");
  const filter = searchParams.get("filter") || "ongoing";
  const sort = searchParams.get("sort") || "newest";
  const searchQuery = searchParams.get("q") || "";

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await adminApi.getOrders(
        page,
        limit,
        filter,
        sort,
        searchQuery
      );
      setOrders(resp.orders);
      setTotalPages(resp.totalPages);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : (error as { message?: string })?.message ||
            "Failed to fetch orders";
      addAlert("error", msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filter, sort, searchQuery, addAlert]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      prev.set("filter", e.target.value);
      prev.set("page", "1");
      return prev;
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => {
      prev.set("sort", e.target.value);
      prev.set("page", "1");
      return prev;
    });
  };

  const handleCancelClick = (id: string) => {
    setOrderToCancel(id);
    setIsModalOpen(true);
  };

  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await adminApi.cancelOrder(orderToCancel);
      addAlert("success", "Order cancelled successfully");
      fetchOrders(); // Refresh list
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to cancel order";
      addAlert("error", msg);
    } finally {
      setIsModalOpen(false);
      setOrderToCancel(null);
    }
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      await adminApi.deleteOrder(orderToDelete);
      addAlert("success", "Order deleted successfully");
      fetchOrders(); // Refresh list
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to delete order";
      addAlert("error", msg);
    } finally {
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-800">Orders Management</h1>
        <p className="text-sm text-gray-500">
          Manage user orders, track status, and view details.
        </p>
      </div>

      {/* Control Bar (Filter, Sort, Pagination) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="relative">
              <select
                value={filter}
                onChange={handleFilterChange}
                className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
              >
                {ADMIN_ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <div className="relative">
              <select
                value={sort}
                onChange={handleSortChange}
                className="custom-select pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-primary-blue transition-colors focus:ring-0"
              >
                {ADMIN_ORDER_SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pagination Controls in Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
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
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List Info Text */}
      {searchQuery && (
        <div className="text-gray-500 text-sm italic">
          Searching for: "{searchQuery}"
        </div>
      )}

      {/* Orders List Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onCancel={handleCancelClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
          <p className="text-gray-500">
            No orders found matching your criteria.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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

export default AdminOrdersContainer;
