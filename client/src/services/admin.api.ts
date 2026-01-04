import { handleResponse } from "@utils/handleResponse";
import type { Product } from "@interfaces/product";
import type {
  IOrder,
  DashboardStats,
  CategoryWithStats,
  PaginatedCategoriesResponse,
  ChatMessage,
  PaginatedOrdersResponse,
  SystemConfig,
  GetUsersResponse,
  UserDetailResponse,
  UserProductsResponse,
  OrdersSummary,
  BannedUsersResponse,
  UnbanRequestData,
  User,
  Review,
  UpgradeRequest,
  AdminProductDetails,
  GetProductsParams,
  GetProductsResponse,
  SellerOption,
  AdminCreateProductDto,
  UpdateProductDto,
} from "@interfaces/admin";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const adminApi = {
  getDashboardStats: async (
    timeRange: string = "24h"
  ): Promise<DashboardStats> => {
    const response = await fetch(
      `${API_BASE}/api/admin/dashboard-stats?timeRange=${timeRange}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<DashboardStats>(response);
  },

  getProducts: async (options: GetProductsParams) => {
    const { search, ...rest } = options;

    const cleanParams: Record<string, string> = {};

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanParams[key] = String(value);
      }
    });

    if (search && search.trim() !== "") {
      cleanParams.q = search.trim();
    }

    const query = new URLSearchParams(cleanParams);

    const response = await fetch(
      `${API_BASE}/api/admin/products?${query.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<GetProductsResponse>(response);
  },

  // User Management
  getUsers: async (params: {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    viewTrash?: boolean;
  }): Promise<GetUsersResponse> => {
    const { q, ...rest } = params;

    // Build clean query params
    const cleanParams: Record<string, string> = {};

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanParams[key] = String(value);
      }
    });

    // Add search param if provided
    if (q && q.trim() !== "") {
      cleanParams.q = q.trim();
    }

    const query = new URLSearchParams(cleanParams);

    const response = await fetch(
      `${API_BASE}/api/admin/users?${query.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<GetUsersResponse>(response);
  },

  updateUser: async (id: string, data: Partial<User>) => {
    const response = await fetch(`${API_BASE}/api/admin/users/${id}/update`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  blockUser: async (id: string, reason: string) => {
    const response = await fetch(`${API_BASE}/api/admin/users/${id}/block`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  unblockUser: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/admin/users/${id}/unblock`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  deleteUser: async (id: string) => {
    const response = await fetch(`${API_BASE}/api/admin/users/${id}/delete`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  forceDeleteUser: async (id: string) => {
    const response = await fetch(
      `${API_BASE}/api/admin/users/${id}/force-delete`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  getCategories: async (
    page?: number,
    limit?: number,
    search?: string
  ): Promise<CategoryWithStats[] | PaginatedCategoriesResponse> => {
    let url = `${API_BASE}/api/admin/categories`;
    const params = [];

    if (page) {
      params.push(`page=${page}`);
      params.push(`limit=${limit || 8}`);
    }
    if (search) {
      params.push(`q=${encodeURIComponent(search)}`);
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createCategory: async (data: {
    name: string;
    subCategories?: string[];
  }): Promise<CategoryWithStats> => {
    const response = await fetch(`${API_BASE}/api/admin/categories`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateCategory: async (
    id: string,
    data: { name: string; subCategories?: string[] }
  ): Promise<CategoryWithStats> => {
    const response = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteCategory: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getOrders: async (
    page: number = 1,
    limit: number = 10,
    filter: string = "all",
    sort: string = "newest",
    search: string = ""
  ): Promise<PaginatedOrdersResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      filter,
      sort,
      q: search,
    });
    const response = await fetch(`${API_BASE}/api/admin/orders?${params}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getOrderDetails: async (id: string): Promise<IOrder> => {
    const response = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  cancelOrder: async (id: string): Promise<IOrder> => {
    const response = await fetch(`${API_BASE}/api/admin/orders/${id}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  deleteOrder: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  sendAdminMessage: async (
    id: string,
    content: string
  ): Promise<{ messages: ChatMessage[] }> => {
    const response = await fetch(`${API_BASE}/api/admin/orders/${id}/chat`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleResponse(response);
  },

  deleteAdminMessage: async (
    id: string,
    messageId: string
  ): Promise<unknown> => {
    const response = await fetch(
      `${API_BASE}/api/admin/orders/${id}/chat/${messageId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  getSystemConfig: async (): Promise<SystemConfig> => {
    const response = await fetch(`${API_BASE}/api/admin/config`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateSystemConfig: async (data: {
    auctionExtensionWindow?: number; // In minutes
    auctionExtensionTime?: number; // In minutes
    autoBidDelay?: number; // In milliseconds
    bidEmailThrottlingWindow?: number; // In minutes
    bidEmailCooldown?: number; // In hours
  }): Promise<SystemConfig> => {
    const response = await fetch(`${API_BASE}/api/admin/config`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getSellers: async (): Promise<SellerOption[]> => {
    const url = `${API_BASE}/api/admin/sellers`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  createProduct: async (data: AdminCreateProductDto): Promise<Product> => {
    const url = `${API_BASE}/api/admin/products`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  getProductDetails: async (id: string): Promise<AdminProductDetails> => {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateProduct: async (
    id: string,
    data: UpdateProductDto
  ): Promise<Product> => {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  extendProductEndTime: async (
    id: string,
    endTime: string
  ): Promise<Product> => {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}/extend`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ endTime }),
    });
    return handleResponse(res);
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  deleteProductQuestion: async (
    productId: string,
    questionId: string
  ): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_BASE}/api/admin/products/${productId}/questions/${questionId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<{ message: string }>(response);
  },

  getUserDetail: async (
    id: string,
    page: number = 1,
    limit: number = 10
  ): Promise<UserDetailResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(
      `${API_BASE}/api/admin/users/${id}?${params.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<UserDetailResponse>(response);
  },

  // Upgrade Request Management
  getUpgradeRequests: async (
    page: number = 1,
    limit: number = 10,
    status?: "pending" | "approved" | "rejected",
    search?: string,
    sortBy?: "newest" | "oldest"
  ): Promise<{
    requests: UpgradeRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(search && { search }),
      ...(sortBy && { sortBy }),
    });
    const response = await fetch(
      `${API_BASE}/api/admin/upgrade-requests?${params.toString()}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  approveUpgradeRequest: async (
    requestId: string
  ): Promise<{
    request: UpgradeRequest;
    bidderAccount: User;
    sellerAccount: User;
  }> => {
    const response = await fetch(
      `${API_BASE}/api/admin/upgrade-requests/${requestId}/approve`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  rejectUpgradeRequest: async (
    requestId: string,
    reason: string
  ): Promise<UpgradeRequest> => {
    const response = await fetch(
      `${API_BASE}/api/admin/upgrade-requests/${requestId}/reject`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      }
    );
    return handleResponse(response);
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await fetch(`${API_BASE}/api/admin/profile`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await fetch(`${API_BASE}/api/admin/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  resetUserPassword: async (userId: string, newPassword: string) => {
    const response = await fetch(
      `${API_BASE}/api/admin/users/${userId}/reset-password`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword }),
      }
    );
    return handleResponse(response);
  },
};

// Add new methods to adminApi
export const adminApiExtended = {
  // Get linked profile for upgraded accounts
  getLinkedProfile: async (userId: string): Promise<UserDetailResponse> => {
    const response = await fetch(
      `${API_BASE}/api/admin/users/${userId}/linked-profile`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<UserDetailResponse>(response);
  },

  // Get user's products (seller: their products, bidder: participated auctions)
  getUserProducts: async (
    userId: string,
    role: "seller" | "bidder",
    page: number = 1,
    limit: number = 10
  ): Promise<UserProductsResponse> => {
    const params = new URLSearchParams({
      role,
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(
      `${API_BASE}/api/admin/users/${userId}/products?${params}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<UserProductsResponse>(response);
  },

  // Get user's orders summary by status
  getUserOrdersSummary: async (userId: string): Promise<OrdersSummary> => {
    const response = await fetch(
      `${API_BASE}/api/admin/users/${userId}/orders-summary`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<OrdersSummary>(response);
  },

  // Update review comment
  updateReview: async (reviewId: string, comment: string): Promise<Review> => {
    const response = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment }),
    });
    return handleResponse(response);
  },

  // Delete review
  deleteReview: async (
    reviewId: string
  ): Promise<{ message: string; reviewId: string }> => {
    const response = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export const bannedUsersApi = {
  // Get all banned users with pagination
  getBannedUsers: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<BannedUsersResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append("q", search);

    const response = await fetch(
      `${API_BASE}/api/admin/banned-users?${params}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<BannedUsersResponse>(response);
  },

  // Get unban request for a specific user
  getUnbanRequest: async (userId: string): Promise<UnbanRequestData | null> => {
    const response = await fetch(
      `${API_BASE}/api/admin/banned-users/${userId}/unban-request`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<UnbanRequestData | null>(response);
  },

  // Approve unban request
  approveUnbanRequest: async (requestId: string): Promise<UnbanRequestData> => {
    const response = await fetch(
      `${API_BASE}/api/admin/unban-requests/${requestId}/approve`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<UnbanRequestData>(response);
  },

  // Deny unban request
  denyUnbanRequest: async (
    requestId: string,
    adminNote?: string
  ): Promise<UnbanRequestData> => {
    const response = await fetch(
      `${API_BASE}/api/admin/unban-requests/${requestId}/deny`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNote }),
      }
    );
    return handleResponse<UnbanRequestData>(response);
  },
};
