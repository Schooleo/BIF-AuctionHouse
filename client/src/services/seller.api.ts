import { handleResponse } from "@utils/handleResponse";
import type { Product, CreateProductDto } from "@interfaces/product";
import type { User } from "@interfaces/auth";
import type { RatingReceived } from "@interfaces/bidder";
import type {
  UpdateSellerProfileDto,
  ChangeSellerPasswordDto,
  SellerProfileResponse,
  SellerBidHistoryResponse,
} from "@interfaces/seller";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

export const sellerApi = {
  createProduct: async (data: CreateProductDto): Promise<Product> => {
    const url = `${API_BASE}/api/seller/products`;
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

  appendDescription: async (
    id: string,
    description: string
  ): Promise<Product> => {
    const url = `${API_BASE}/api/seller/products/${id}/description`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ description }),
    });

    return handleResponse(res);
  },

  rejectBidder: async (productId: string, bidderId: string) => {
    const url = `${API_BASE}/api/seller/products/${productId}/reject-bidder/${bidderId}`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  answerQuestion: async (
    productId: string,
    questionId: string,
    answer: string
  ) => {
    const url = `${API_BASE}/api/seller/products/${productId}/answer-question/${questionId}`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answer }),
    });

    return handleResponse(res);
  },

  confirmWinner: async (productId: string) => {
    const url = `${API_BASE}/api/seller/products/${productId}/confirm-winner`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  completeTransaction: async (productId: string) => {
    const url = `${API_BASE}/api/seller/products/${productId}/complete-transaction`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  getSellerProducts: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      status?:
        | "all"
        | "ongoing"
        | "ended"
        | "awaiting"
        | "bid_winner"
        | "history";
    } = {}
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.search) query.append("search", params.search);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.status) query.append("status", params.status);

    const url = `${API_BASE}/api/seller/products?${query.toString()}`;
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

  getProfile: async (token: string): Promise<SellerProfileResponse> => {
    const url = `${API_BASE}/api/seller/profile`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  updateProfile: async (
    data: UpdateSellerProfileDto
  ): Promise<{ profile: User }> => {
    const url = `${API_BASE}/api/seller/profile`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  changePassword: async (
    data: ChangeSellerPasswordDto
  ): Promise<{ message: string }> => {
    const url = `${API_BASE}/api/seller/change-password`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  getProductBidHistory: async (
    productId: string,
    params: { page?: number; limit?: number; includeRejected?: boolean }
  ): Promise<SellerBidHistoryResponse> => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 10));
    if (params.includeRejected !== undefined) {
      query.set("includeRejected", String(params.includeRejected));
    }

    const url = `${API_BASE}/api/seller/products/${productId}/bid-history?${query.toString()}`;
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

  rateWinner: async (
    productId: string,
    score: 1 | -1,
    comment: string
  ): Promise<{ message: string }> => {
    const url = `${API_BASE}/api/seller/products/${productId}/rate-winner`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ score, comment }),
    });

    return handleResponse(res);
  },

  cancelTransaction: async (productId: string): Promise<Product> => {
    const url = `${API_BASE}/api/seller/products/${productId}/cancel-transaction`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<{ message: string; product: Product }>(
      res
    );
    return data.product;
  },

  transferWinner: async (productId: string): Promise<{ message: string }> => {
    const url = `${API_BASE}/api/seller/products/${productId}/transfer-winner`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  archiveCancelledProduct: async (
    productId: string
  ): Promise<{ message: string }> => {
    const url = `${API_BASE}/api/seller/products/${productId}/archive`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  getReceivedRatings: async (
    page: number = 1,
    limit: number = 10,
    score?: 1 | -1
  ): Promise<{
    data: RatingReceived[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    let url = `${API_BASE}/api/seller/ratings-received?page=${page}&limit=${limit}`;
    if (score) {
      url += `&score=${score}`;
    }
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
};
