import type {
  Product,
  HomeDataResponse,
  FetchProductsDto,
  FetchProductDetailsDto,
  Category,
  ProductDetails,
} from "@interfaces/product";
import type { IPaginatedResponse } from "@interfaces/ui";
import { handleResponse } from "@utils/handleResponse";
import { useAuthStore } from "@stores/useAuthStore";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const productApi = {
  fetchHomeData: async (): Promise<HomeDataResponse> => {
    const url = `${API_BASE}/api/guest/home`;

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse(res);
  },

  fetchCategories: async (): Promise<Category[]> => {
    const url = `${API_BASE}/api/guest/categories`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return handleResponse(res);
  },

  fetchProducts: async ({
    page,
    limit,
    categoryId,
    query,
    sort,
    minPrice,
    maxPrice,
  }: FetchProductsDto): Promise<IPaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (categoryId) params.append("category", categoryId);
    if (query) params.append("q", query);
    if (sort) params.append("sort", sort);
    if (minPrice !== undefined) params.append("min_price", minPrice.toString());
    if (maxPrice !== undefined) params.append("max_price", maxPrice.toString());

    const url = `${API_BASE}/api/guest/products?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse(res);
  },

  fetchProductDetails: async ({
    id,
  }: FetchProductDetailsDto): Promise<ProductDetails> => {
    const params = new URLSearchParams();

    const paramString = params.toString() ? `?${params.toString()}` : "";

    const url = `${API_BASE}/api/guest/product/${id}${paramString}`;

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse(res);
  },

  getUserRatings: async ({
    userId,
    page = 1,
    limit = 10,
    score,
  }: {
    userId: string;
    page?: number;
    limit?: number;
    score?: 1 | -1;
  }): Promise<{
    user: {
      _id: string;
      name: string;
      positiveRatings: number;
      negativeRatings: number;
      reputationScore: number;
    };
    ratings: Array<{
      _id: string;
      rater: {
        _id: string;
        name: string;
      };
      score: 1 | -1;
      comment: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (score !== undefined) params.append("score", score.toString());

    const url = `${API_BASE}/api/guest/users/${userId}/ratings?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse(res);
  },
};
