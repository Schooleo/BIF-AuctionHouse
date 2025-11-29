import { handleResponse } from "@utils/handleResponse";
import type { Product, CreateProductDto } from "@interfaces/product";

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

  getSellerProducts: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      status?: "all" | "ongoing" | "ended";
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
};
