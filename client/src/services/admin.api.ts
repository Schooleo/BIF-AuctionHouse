import { handleResponse } from "@utils/handleResponse";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export interface DashboardStats {
  userStats: {
    total: number;
    byRole: {
      bidder?: number;
      seller?: number;
      admin?: number;
      [key: string]: number | undefined;
    };
  };
  productStats: {
    ongoing: {
      total: number;
      byCategory: { name: string; count: number }[];
    };
    all: {
      total: number;
      byCategory: { name: string; count: number }[];
    };
  };
  orderStats: { status: string; count: number }[];
  bidStats: {
    hourly: {
      _id: { year: number; month: number; day: number; hour: number };
      count: number;
    }[];
    hourlyAuto: {
      _id: { year: number; month: number; day: number; hour: number };
      count: number;
    }[];
    top10: {
      _id: string;
      price: number;
      product?: { name: string };
      bidder?: { name: string; email: string };
      createdAt: string;
    }[];
  };
}

export interface CategoryWithStats {
  _id: string;
  name: string;
  productCount: number;
  representativeImage: string | null;
  children: CategoryWithStats[];
  parent?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCategoriesResponse {
  categories: CategoryWithStats[];
  total: number;
  totalPages: number;
  page: number;
}

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    role: string;
    email?: string;
  };
  content: string;
  timestamp: string;
  isAdmin?: boolean;
}

export interface IOrder {
  _id: string;
  product:
    | {
        _id: string;
        name: string;
        mainImage: string;
        currentPrice?: number;
        [key: string]: unknown;
      }
    | string;
  seller:
    | {
        _id: string;
        name: string;
        email?: string;
        reputation?: number;
        rating?: number;
        avatar?: string;
        [key: string]: unknown;
      }
    | string;
  buyer:
    | {
        _id: string;
        name: string;
        email?: string;
        reputation?: number;
        rating?: number;
        avatar?: string;
        [key: string]: unknown;
      }
    | string;

  productInfo?: { name: string; mainImage: string; currentPrice?: number };
  sellerInfo?: {
    name: string;
    email?: string;
    reputation?: number;
    rating?: number;
    avatar?: string;
  };
  buyerInfo?: {
    name: string;
    email?: string;
    reputation?: number;
    rating?: number;
    avatar?: string;
  };

  status: string;
  step: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: string;
  paymentProof?: string;
  buyerNote?: string;
  shippingProof?: string;
  sellerNote?: string;
  chat?: { messages: ChatMessage[] };
  [key: string]: unknown;
}

export interface PaginatedOrdersResponse {
  orders: IOrder[];
  total: number;
  totalPages: number;
  page: number;
}

export interface SystemConfig {
  _id: string;
  auctionExtensionWindow: number;
  auctionExtensionTime: number;
  autoBidDelay: number;
  createdAt: string;
  updatedAt: string;
}

// User Interface
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "BLOCKED";
  avatar?: string;
  createdAt: string;
  contactEmail?: string;
  address?: string;
}

export interface GetUsersResponse {
  users: User[];
  totalDocs: number;
  totalPages: number;
  currentPage: number;
}

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
      cleanParams.search = q.trim();
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

  updateUser: async (id: string, data: any) => {
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
  }): Promise<SystemConfig> => {
    const response = await fetch(`${API_BASE}/api/admin/config`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
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
};

export interface UserDetailResponse {
  profile: User & {
    starRating: number; // 0-5 scale
    ratingCount: number; // Total number of reviews
    reputationParam: {
      positive: number;
      negative: number;
      score: number;
    };
  };
  bidHistory: {
    _id: string;
    productName: string;
    amount: number;
    date: string;
    status: string;
  }[];
  reviews: {
    docs: {
      _id: string;
      rater: { name: string; avatar?: string };
      score: number; // +1 or -1 (binary)
      comment: string;
      createdAt: string;
    }[];
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  sellingHistory: {
    _id: string;
    name: string;
    currentPrice: number;
    endTime: string;
    mainImage: string;
    bidCount: number;
  }[];
  stats: {
    positiveCount: number;
    negativeCount: number;
  };
}
