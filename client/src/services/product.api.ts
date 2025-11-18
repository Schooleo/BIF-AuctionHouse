import type { Product } from "@interfaces/product";
import { handleResponse } from "@utils/handleResponse";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

export const productApi = {
  fetchProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_BASE}/api/products`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },
};
