import type {
  Product,
  FetchByCategoryDto,
  SearchProductsDto,
  HomeDataResponse, 
  Category 
} from "@interfaces/product";
import type { IPaginatedResponse } from "@interfaces/ui";
import { handleResponse } from "@utils/handleResponse";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

export const productApi = {
  fetchProductsByCategory: async ({
    page,
    limit,
    categoryId,
  }: FetchByCategoryDto): Promise<IPaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (categoryId) params.append("category", categoryId);

    const url = `${API_BASE}/api/guest/products?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return handleResponse(res);
  },

  searchProducts: async ({
    page,
    limit,
    query,
  }: SearchProductsDto): Promise<IPaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    params.append("q", query);

    const url = `${API_BASE}/api/guest/products/search?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return handleResponse(res);
  },

  viewProductDetail: async (id: string): Promise<Product> => {
    const res = await fetch(`${API_BASE}/api/guest/products/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },

  fetchHomeData: async (): Promise<HomeDataResponse> => {
    const res = await fetch(`${API_BASE}/api/guest/home`, { 
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },

  fetchCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE}/api/guest/categories`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },
};
