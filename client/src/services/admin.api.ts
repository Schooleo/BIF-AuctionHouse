import { handleResponse } from "@utils/handleResponse";
import type { Product, CreateProductDto } from "@interfaces/product";

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

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: "active" | "ended";
  categories?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SellerOption {
  _id: string;
  name: string;
  email: string;
}

export interface AdminCreateProductDto extends Omit<CreateProductDto, "seller"> {
  sellerId: string;
}

export interface AdminProductDetails {
  product: Product;
  bidHistory: {
    _id: string;
    bidder: {
      _id: string;
      name: string;
      rating: number;
    };
    price: number;
    createdAt: string;
  }[];
  isEnded: boolean;
  order?: {
    _id: string;
    status: string;
    buyer: {
      _id: string;
      name: string;
      email: string;
      rating: number;
    };
    shippingAddress?: string;
    paymentProof?: string;
    shippingProof?: string;
  } | null;
}

export interface UpdateProductDto {
  name?: string;
  category?: string;
  mainImage?: string;
  subImages?: string[];
  description?: string;
  endTime?: string;
  startingPrice?: number;
  stepPrice?: number;
  buyNowPrice?: number;
  autoExtends?: boolean;
  allowUnratedBidders?: boolean;
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

  getProducts: async (
    params: GetProductsParams = {}
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
    if (params.categories) query.append("categories", params.categories);
    if (params.minPrice !== undefined) query.append("minPrice", params.minPrice.toString());
    if (params.maxPrice !== undefined) query.append("maxPrice", params.maxPrice.toString());

    const url = `${API_BASE}/api/admin/products?${query.toString()}`;
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
    const res = await fetch(
      `${API_BASE}/api/admin/products/${id}/extend`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ endTime }),
      }
    );
    return handleResponse(res);
  },

  deleteProduct: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  deleteProductQuestion: async (productId: string, questionId: string): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_BASE}/api/admin/products/${productId}/questions/${questionId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<{ message: string }>(response);
  },

};
