import { handleResponse } from "@utils/handleResponse";
import type { Order, Chat, Message } from "../interfaces/order";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

export const orderApi = {
  createOrder: async (productId: string): Promise<Order> => {
    const url = `${API_BASE}/api/orders`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    });

    return handleResponse(res);
  },

  getOrderByProduct: async (productId: string): Promise<Order | null> => {
    const url = `${API_BASE}/api/orders/product/${productId}`;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 404) return null;
      return handleResponse(res);
    } catch (error) {
      console.error("Error fetching order by product:", error);
      return null;
    }
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const url = `${API_BASE}/api/orders/${orderId}`;
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

  updateStep1: async (
    orderId: string,
    data: { address: string; note?: string; paymentProof?: string }
  ): Promise<Order> => {
    const url = `${API_BASE}/api/orders/${orderId}/step1`;
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

  updateStep2: async (
    orderId: string,
    data: {
      shippingProof?: string;
      note?: string;
      confirmPayment: boolean;
    }
  ): Promise<Order> => {
    const url = `${API_BASE}/api/orders/${orderId}/step2`;
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

  updateStep3: async (orderId: string): Promise<Order> => {
    const url = `${API_BASE}/api/orders/${orderId}/step3`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  submitRating: async (
    orderId: string,
    score: 1 | -1,
    comment: string
  ): Promise<Order> => {
    const url = `${API_BASE}/api/orders/${orderId}/rating`;
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

  getChat: async (orderId: string): Promise<Chat> => {
    const url = `${API_BASE}/api/orders/${orderId}/chat`;
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

  sendMessage: async (
    orderId: string,
    content: string,
    isImage: boolean = false
  ): Promise<Message> => {
    const url = `${API_BASE}/api/orders/${orderId}/chat`;
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, isImage }),
    });

    return handleResponse(res);
  },
};
