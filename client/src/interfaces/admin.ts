export interface OrderUserInfo {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  reputation?: number;
  rating?: number;
  reputationScore?: number;
  role?: string;
  [key: string]: unknown;
}

export interface DashboardStats {
  userStats: {
    total: number;
    byRole: {
      bidder?: number;
      seller?: number;
      admin?: number;
      [key: string]: number | undefined;
    };
  };
  productStats: {
    ongoing: {
      total: number;
      byCategory: { name: string; count: number }[];
    };
    all: {
      total: number;
      byCategory: { name: string; count: number }[];
    };
  };
  orderStats: { status: string; count: number }[];
  bidStats: {
    hourly: {
      _id: { year: number; month: number; day: number; hour: number };
      count: number;
    }[];
    hourlyAuto: {
      _id: { year: number; month: number; day: number; hour: number };
      count: number;
    }[];
    top10: {
      _id: string;
      price: number;
      product?: { name: string };
      bidder?: { name: string; email: string };
      createdAt: string;
    }[];
  };
}

export interface CategoryWithStats {
  _id: string;
  name: string;
  productCount: number;
  representativeImage: string | null;
  children: CategoryWithStats[];
  parent?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCategoriesResponse {
  categories: CategoryWithStats[];
  total: number;
  totalPages: number;
  page: number;
}

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    role: string;
    email?: string;
  };
  content: string;
  timestamp: string;
  isAdmin?: boolean;
}

export interface IOrder {
  _id: string;
  product:
    | {
        _id: string;
        name: string;
        mainImage: string;
        currentPrice?: number;
        [key: string]: unknown;
      }
    | string;
  seller:
    | {
        _id: string;
        name: string;
        email?: string;
        reputation?: number;
        rating?: number;
        avatar?: string;
        [key: string]: unknown;
      }
    | string;
  buyer:
    | {
        _id: string;
        name: string;
        email?: string;
        reputation?: number;
        rating?: number;
        avatar?: string;
        [key: string]: unknown;
      }
    | string;

  productInfo?: {
    _id?: string;
    name: string;
    mainImage: string;
    currentPrice?: number;
  };
  sellerInfo?: OrderUserInfo;
  buyerInfo?: OrderUserInfo;

  status: string;
  step: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: string;
  paymentProof?: string;
  buyerNote?: string;
  shippingProof?: string;
  sellerNote?: string;
  chat?: { messages: ChatMessage[] };
  [key: string]: unknown;
}

export interface PaginatedOrdersResponse {
  orders: IOrder[];
  total: number;
  totalPages: number;
  page: number;
}

export interface SystemConfig {
  _id: string;
  auctionExtensionWindow: number;
  auctionExtensionTime: number;
  autoBidDelay: number;
  bidEmailThrottlingWindow: number;
  bidEmailCooldown: number;
  createdAt: string;
  updatedAt: string;
}

// User Management Interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "seller" | "bidder";
  status: "ACTIVE" | "BLOCKED";
  avatar?: string;
  createdAt: string;
  contactEmail?: string;
  address?: string;
  dateOfBirth?: string;
  [key: string]: unknown;
}

export interface GetUsersResponse {
  users: User[];
  totalDocs: number;
  totalPages: number;
  currentPage: number;
}

export interface UserDetailResponse {
  profile: User & {
    starRating: number;
    ratingCount: number;
    reputationParam: {
      positive: number;
      negative: number;
      score: number;
    };
    isUpgradedAccount?: boolean;
    linkedAccountId?: string;
    blockReason?: string;
  };
  bidHistory: {
    _id: string;
    productName: string;
    amount: number;
    date: string;
    status: string;
  }[];
  reviews: {
    docs: {
      _id: string;
      rater: { _id?: string; name: string; avatar?: string };
      ratee?: { _id?: string; name: string; avatar?: string };
      product?: { _id?: string; name: string; mainImage?: string };
      score: number;
      comment: string;
      createdAt: string;
    }[];
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  sellingHistory: {
    _id: string;
    name: string;
    currentPrice: number;
    endTime: string;
    mainImage: string;
    bidCount: number;
  }[];
  stats: {
    positiveCount: number;
    negativeCount: number;
  };
}

// Extended User & Review Interfaces
export interface UserProduct {
  _id: string;
  name: string;
  currentPrice: number;
  mainImage: string;
  endTime: string;
  startTime?: string;
  bidCount?: number;
  status:
    | "scheduled"
    | "ongoing"
    | "ended"
    | "sold"
    | "won"
    | "lost"
    | "leading"
    | "outbid";
  myBidCount?: number;
  myHighestBid?: number;
}

export interface UserProductsResponse {
  products: UserProduct[];
  total: number;
  totalPages: number;
  page: number;
}

export interface OrdersSummary {
  summary: {
    PENDING_PAYMENT: number;
    PAID_CONFIRMED: number;
    SHIPPED: number;
    RECEIVED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  total: number;
  role: string;
}

// Banned Users & Unban Request Interfaces
export interface BannedUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  blockReason?: string;
  blockedAt?: string;
  createdAt: string;
  hasUnbanRequest: boolean;
}

export interface BannedUsersResponse {
  users: BannedUser[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface UnbanRequestData {
  _id: string;
  user: string;
  title: string;
  details: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  adminNote?: string;
  processedBy?: { _id: string; name: string; email: string };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  rater: { _id?: string; name: string; avatar?: string };
  ratee?: { _id?: string; name: string; avatar?: string };
  product?: { _id?: string; name: string; mainImage?: string };
  score: number;
  comment: string;
  createdAt: string;
}

export interface UpgradeRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    contactEmail?: string;
    rating?: {
      positive: number;
      negative: number;
    };
    rejectedRequestsCount?: number;
  };
  status: "pending" | "approved" | "rejected";
  title: string;
  reasons: string;
  createdAt: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  rejectedAt?: string;
}

// Product Helper Interfaces
import type { Product, CreateProductDto } from "@interfaces/product";

export interface AdminProductDetails {
  product: Product;
  bidHistory: {
    _id: string;
    bidder: {
      _id: string;
      name: string;
      avatar?: string;
      reputationScore?: number;
    };
    price: number;
    createdAt: string;
  }[];
  isEnded: boolean;
  order?: IOrder;
}

export interface GetProductsParams {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  status: "active" | "ended";
  categories?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface GetProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SellerOption {
  _id: string;
  name: string;
  email: string;
}

export type AdminCreateProductDto = CreateProductDto & { sellerId: string };
export type UpdateProductDto = Partial<CreateProductDto>;
