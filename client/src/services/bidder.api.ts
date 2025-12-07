import type {
  BidderProfile,
  UpdateProfileDto,
  ChangePasswordDto,
  RatingReceived,
  WatchlistItem,
  AuctionItem,
  RateSellerDto,
  UpgradeRequestStatus,
} from '@interfaces/bidder';
import type { IPaginatedResponse } from '@interfaces/ui';
import { handleResponse } from '@utils/handleResponse';

const API_BASE = import.meta.env.VITE_APP_API_URL || '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const bidderApi = {
  // Profile Management
  getProfile: async (): Promise<BidderProfile> => {
    const res = await fetch(`${API_BASE}/api/bidder/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (data: UpdateProfileDto): Promise<BidderProfile> => {
    const res = await fetch(`${API_BASE}/api/bidder/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/api/bidder/profile/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Ratings
  getReceivedRatings: async (
    page: number = 1,
    limit: number = 10,
    filter?: 'positive' | 'negative'
  ): Promise<IPaginatedResponse<RatingReceived>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filter) {
      params.append('filter', filter);
    }
    const res = await fetch(`${API_BASE}/api/bidder/profile/ratings?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-cache',
    });
    return handleResponse(res);
  },

  // Watchlist
  getWatchlist: async (page: number = 1, limit: number = 10): Promise<IPaginatedResponse<WatchlistItem>> => {
    const res = await fetch(`${API_BASE}/api/bidder/watchlist?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  addToWatchlist: async (productId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/api/bidder/watchlist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId }),
    });
    return handleResponse(res);
  },

  // Auctions
  getParticipatingAuctions: async (page: number = 1, limit: number = 10): Promise<IPaginatedResponse<AuctionItem>> => {
    const res = await fetch(`${API_BASE}/api/bidder/participating-auctions?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getWonAuctions: async (page: number = 1, limit: number = 10): Promise<IPaginatedResponse<AuctionItem>> => {
    const res = await fetch(`${API_BASE}/api/bidder/won-auctions?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Rate Seller
  rateSeller: async (sellerId: string, data: RateSellerDto): Promise<{ rating: RatingReceived }> => {
    const res = await fetch(`${API_BASE}/api/bidder/rate-seller/${sellerId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateSellerRating: async (sellerId: string, data: RateSellerDto): Promise<{ rating: RatingReceived }> => {
    const res = await fetch(`${API_BASE}/api/bidder/rate-seller/${sellerId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteSellerRating: async (sellerId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/api/bidder/rate-seller/${sellerId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Upgrade Request
  requestSellerUpgrade: async (reason: string): Promise<{ request: UpgradeRequestStatus }> => {
    const res = await fetch(`${API_BASE}/api/bidder/request-seller-upgrade`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  getUpgradeRequestStatus: async (): Promise<{ request: UpgradeRequestStatus | null }> => {
    const res = await fetch(`${API_BASE}/api/bidder/upgrade-request-status`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
