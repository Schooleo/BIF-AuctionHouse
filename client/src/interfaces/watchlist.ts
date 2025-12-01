import type { Product } from "./product";

export interface WatchlistItem {
  _id: string;
  user: string;
  product: Product;
  createdAt: string;
  updatedAt: string;
}

export interface GetWatchlistResponse {
  watchlist: WatchlistItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}