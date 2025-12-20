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

// User Interface
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "BLOCKED";
  isDeleted: boolean;
  avatar?: string;
  createdAt: string;
  contactEmail?: string;
  address?: string;
  deletedAt?: string;
  deleteReason?: string;
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
  }): Promise<GetUsersResponse> => {
    const { q, ...rest } = params;
    // Construct query string
    const query = new URLSearchParams(rest as any);
    if (q) query.append("search", q);

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

  deleteUser: async (id: string, reason: string) => {
    const response = await fetch(`${API_BASE}/api/admin/users/${id}/delete`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
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
