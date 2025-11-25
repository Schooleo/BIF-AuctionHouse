export interface QuestionAnswer {
  _id: string;
  question: string;
  questioner: UserSummary;
  askedAt: string;
  answer?: string;
  answeredAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;

  mainImage?: string;
  subImages?: string[];

  startingPrice: number;
  currentPrice: number;
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
  highestBidder: UserSummary;

  bidCount: number;

  questions?: QuestionAnswer[];
  related?: Product[];
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
  | "mostBidOn"
  | "highestPriced";

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
}

export interface FetchProductDetailsDto {
  id: string;
}
