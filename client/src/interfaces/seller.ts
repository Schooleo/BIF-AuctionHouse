export interface SellerBidHistoryResponse = {
  bidHistory: {
    _id: string;
    price: number;
    createdAt: string;
    bidder: {
      _id: string;
      name?: string;
      rating?: number;
    } | null;
  }[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBids: number;
    limit: number;
  };
};