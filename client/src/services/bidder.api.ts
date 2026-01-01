import { handleResponse } from "@utils/handleResponse";
import type { BidHistoryItem } from "@interfaces/product";
import type { GetWatchlistResponse } from "@interfaces/watchlist";
import type {
  BidderProfile,
  UpdateProfileDto,
  ChangePasswordDto,
  RatingReceived,
  AuctionItem,
  RateSellerDto,
  UpgradeRequestStatus,
  GetMyBidsResponse,
} from "@interfaces/bidder";
import type { IPaginatedResponse } from "@interfaces/ui";

const API_BASE = import.meta.env.VITE_APP_API_URL || "";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

interface SuggestedPriceResponse {
  suggestedPrice: number;
  currentPrice: number;
  stepPrice: number;
  buyNowPrice?: number;
  myAutoBidMaxPrice?: number;
  myAutoBidStepPrice?: number;
  myAutoBidLastViewedBidCount?: number;
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

interface AskQuestionResponse {
  message: string;
  question: {
    _id: string;
    question: string;
    questioner: {
      _id: string;
      name: string;
    };
    askedAt: string;
  };
}

export const bidderApi = {
  getSuggestedPrice: async (productId: string, token: string): Promise<SuggestedPriceResponse> => {
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

  acknowledgeAutoBid: async (productId: string, token: string): Promise<{ success: boolean }> => {
    const url = `${API_BASE}/api/bidder/bid/acknowledge-auto-bid`;
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

  setAutoBid: async (
    productId: string,
    maxPrice: number,
    stepPrice: number,
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
        maxPrice,
        stepPrice,
      }),
    });

    return handleResponse(res);
  },

  placeBid: async (
    productId: string,
    price: number, // Legacy param name, mapped to maxPrice
    token: string
  ): Promise<PlaceBidResponse> => {
    // Legacy support: manual bid is just auto bid with 0 step (default)
    return bidderApi.setAutoBid(productId, price, 0, token);
  },

  addToWatchlist: async (productId: string, token: string): Promise<AddToWatchlistResponse> => {
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

  getMyBids: async (
    page: number = 1,
    limit: number = 10,
    sortBy: "endTime" | "price" | "bidCount" = "endTime",
    sortOrder: "asc" | "desc" = "desc",
    status?: "active" | "awaiting" | "processing" | "all"
  ): Promise<GetMyBidsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (status && status !== "all") {
      params.append("status", status);
    }

    const url = `${API_BASE}/api/bidder/my-bids?${params}`;
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse(res);
  },

  askQuestion: async (productId: string, question: string, token: string): Promise<AskQuestionResponse> => {
    const url = `${API_BASE}/api/bidder/ask-seller/${productId}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question }),
    });

    return handleResponse(res);
  },

  getWatchlist: async (
    token: string,
    page: number = 1,
    limit: number = 10,
    sortBy: "createdAt" | "endTime" | "currentPrice" = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<GetWatchlistResponse> => {
    const url = `${API_BASE}/api/bidder/watchlist?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  removeFromWatchlist: async (productId: string, token: string): Promise<{ message: string }> => {
    const url = `${API_BASE}/api/bidder/watchlist/${productId}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  checkInWatchlist: async (productId: string, token: string): Promise<{ inWatchlist: boolean }> => {
    const url = `${API_BASE}/api/bidder/watchlist/check/${productId}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  // Profile Management
  getProfile: async (): Promise<BidderProfile> => {
    const res = await fetch(`${API_BASE}/api/bidder/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (data: UpdateProfileDto): Promise<BidderProfile> => {
    const res = await fetch(`${API_BASE}/api/bidder/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/api/bidder/profile/password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Ratings
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
    let url = `${API_BASE}/api/bidder/profile/ratings?page=${page}&limit=${limit}`;
    if (score) {
      url += `&score=${score}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Auctions
  getParticipatingAuctions: async (page: number = 1, limit: number = 10): Promise<IPaginatedResponse<AuctionItem>> => {
    const res = await fetch(`${API_BASE}/api/bidder/participating-auctions?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getWonAuctions: async (page: number = 1, limit: number = 10): Promise<IPaginatedResponse<AuctionItem>> => {
    const res = await fetch(`${API_BASE}/api/bidder/won-auctions?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Rate Seller
  rateSeller: async (sellerId: string, data: RateSellerDto): Promise<{ rating: RatingReceived }> => {
    const res = await fetch(`${API_BASE}/api/bidder/rate-seller/${sellerId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateSellerRating: async (sellerId: string, data: RateSellerDto): Promise<{ rating: RatingReceived }> => {
    const res = await fetch(`${API_BASE}/api/bidder/rate-seller/${sellerId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSellerRating: async (sellerId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/api/bidder/rate-seller/${sellerId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Upgrade Request
  requestSellerUpgrade: async (title: string, reasons: string): Promise<{ request: UpgradeRequestStatus }> => {
    const res = await fetch(`${API_BASE}/api/bidder/request-seller-upgrade`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, reasons }),
    });
    return handleResponse(res);
  },

  getUpgradeRequestStatus: async (): Promise<{
    request: UpgradeRequestStatus | null;
  }> => {
    const res = await fetch(`${API_BASE}/api/bidder/upgrade-request-status`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
