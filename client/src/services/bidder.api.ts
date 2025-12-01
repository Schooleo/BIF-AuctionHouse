import { handleResponse } from "@utils/handleResponse";
import type { BidHistoryItem } from "@interfaces/product";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

interface SuggestedPriceResponse {
  suggestedPrice: number;
  currentPrice: number;
  stepPrice: number;
}

interface PlaceBidResponse {
  message: string;
  data: {
    bid: {
      _id?: string;
      product?: string;
      bidder?: string;
      price: number;
      createdAt?: string;
    };
    product: {
      currentPrice: number;
      currentBidder: {
        _id: string;
        name: string;
        rating: number;
      };
      bidCount: number;
    };
  };
}

interface AddToWatchlistResponse {
  message: string;
  data: {
    _id: string;
    user: string;
    product: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface BidHistoryResponse {
  bidHistory: BidHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBids: number;
    limit: number;
  };
}

export const bidderApi = {
  getSuggestedPrice: async (
    productId: string,
    token: string
  ): Promise<SuggestedPriceResponse> => {
    const url = `${API_BASE}/api/bidder/bid/suggest/${productId}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  placeBid: async (
    productId: string,
    price: number,
    token: string
  ): Promise<PlaceBidResponse> => {
    const url = `${API_BASE}/api/bidder/bid`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
        price,
      }),
    });

    return handleResponse(res);
  },

  addToWatchlist: async (
    productId: string,
    token: string
  ): Promise<AddToWatchlistResponse> => {
    const url = `${API_BASE}/api/bidder/watchlist`;

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

  getBidHistory: async (
    productId: string,
    token: string,
    page: number = 1,
    limit: number = 10
  ): Promise<BidHistoryResponse> => {
    const url = `${API_BASE}/api/bidder/bid-history/${productId}?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },
}
