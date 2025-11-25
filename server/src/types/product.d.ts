export interface UserSummary {
  _id: string;
  name: string;
  rating: number;
}

export interface QuestionAnswer {
  _id: string;
  question: string;
  questioner: UserSummary;
  askedAt: string;
  answer: string | undefined;
  answeredAt: string | undefined;
}

export interface BidHistoryEntry {
  _id: string;
  bidder: UserSummary | { _id: string };
  price: number;
  createdAt: string;
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
  category: string | Category;
  seller: UserSummary;
  startTime: string;
  endTime: string;
  bidCount: number;
  bidders?: Bid[];
  highestBid?: {
    amount: number;
    bidder: UserSummary | string | null;
    startTime: string | Date | null;
  } | null;
  highestBidder?: UserSummary | null;
  questions?: QuestionAnswer[];
  related?: Product[];
}

export interface ProductDetails {
  product: Product;
  highestBid: {
    amount: number;
    bidder: UserSummary | string;
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

export type ProductSortOption =
  | "default"
  | "endingSoon"
  | "mostBidOn"
  | "highestPriced";

export interface SearchParams {
  q: string;
  page: number;
  limit: number;
  sort: ProductSortOption | "rating";
  category?: string | undefined;
  newMinutes?: number | undefined;
}
