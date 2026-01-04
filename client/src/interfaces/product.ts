export interface QuestionAnswer {
  _id: string;
  question: string;
  questioner: UserSummary;
  askedAt: string;
  answer?: string;
  answeredAt?: string;
  answerer?: UserSummary;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  descriptionHistory?: {
    content: string;
    updatedAt: string;
  }[];

  mainImage?: string;
  subImages?: string[];

  startingPrice: number;
  currentPrice: number;
  stepPrice: number;
  buyNowPrice?: number;

  category: Category | string;
  seller: UserSummary;

  // Auction State
  startTime: string;
  endTime: string;
  timeRemainingMs?: number;
  isEndingSoon?: boolean;
  isNew?: boolean;

  bidders?: Bid[];

  highestBid?: {
    amount: number;
    bidder: UserSummary | string | null;
    startTime: Date | string | null;
  } | null;
  highestBidder?: UserSummary | null;

  // Direct Auction Data
  bidCount: number;
  currentBidder?: UserSummary | null;

  // Configuration
  autoExtends?: boolean;
  allowUnratedBidders?: boolean;
  questions?: QuestionAnswer[];

  winnerConfirmed?: boolean;
  transactionCompleted?: boolean;

  isRatedBySeller?: boolean;
  sellerRating?: {
    score: number;
    comment: string;
  };
  rejectedBidders?: string[];
  latestOrder?: {
    _id: string;
    status: string;
    buyer: UserSummary;
    ratingBySeller?: {
      score: 1 | -1;
      comment: string;
    };
  };
}

export interface BidHistoryEntry {
  _id: string;
  bidder: UserSummary | { _id: string };
  price: number;
  createdAt: string;
}

export interface ProductDetails {
  product: Product;
  highestBid: {
    amount: number;
    bidder: string | UserSummary;
    startTime: string;
  };
  bidCount: number;
  bidHistory: BidHistoryEntry[];
  questions: QuestionAnswer[];
  related: Product[];
  timeRemainingMs: number;
  isEndingSoon: boolean;
  isNew: boolean;
}

export type ProductSortOption =
  | "default"
  | "endingSoon"
  | "endingLatest"
  | "mostBidOn"
  | "leastBidOn"
  | "highestPriced"
  | "lowestPriced"
  | "newest"
  | "oldest";

export interface Category {
  _id: string;
  name: string;
  parentCategoryId?: string;
  children?: Category[];
}

export interface Bid {
  _id: string;
  bidder: UserSummary;
  price: number;
  time: string;
}

export interface UserSummary {
  _id: string;
  name: string;
  rating: number;
  role?: string;
}

export interface HomeDataResponse {
  endingSoon: Product[];
  mostBids: Product[];
  highestPrice: Product[];
}

export interface PaginatedFetchDto {
  page: number;
  limit: number;
}

// Arguments for fetching products by category
export interface FetchProductsDto extends PaginatedFetchDto {
  categoryId?: string;
  query?: string;
  sort?: ProductSortOption;
  minPrice?: number;
  maxPrice?: number;
}

export interface FetchProductDetailsDto {
  id: string;
}

export interface CreateProductDto {
  name: string;
  category: string;
  mainImage: string;
  subImages: string[];
  description: string;
  endTime: string;
  startingPrice: number;
  stepPrice: number;
  buyNowPrice?: number;
  autoExtends?: boolean;
  allowUnratedBidders?: boolean;
}

export interface BidHistoryItem {
  bidder: string;
  price: number;
  time: string;
}
