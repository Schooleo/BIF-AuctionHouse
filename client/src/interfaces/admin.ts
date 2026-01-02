export interface SimpleUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "seller" | "bidder";
  avatar?: string;
  contactEmail?: string;
  address?: string;
  dateOfBirth?: string;
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

  productInfo?: { name: string; mainImage: string; currentPrice?: number };
  sellerInfo?: {
    name: string;
    email?: string;
    reputation?: number;
    rating?: number;
    avatar?: string;
  };
  buyerInfo?: {
    name: string;
    email?: string;
    reputation?: number;
    rating?: number;
    avatar?: string;
  };

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
  createdAt: string;
  updatedAt: string;
}
