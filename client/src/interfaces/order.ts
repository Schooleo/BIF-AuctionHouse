import type { Product, UserSummary } from "./product";

export interface Order {
  _id: string;
  product: Product;
  seller: UserSummary;
  buyer: UserSummary;
  status:
    | "PENDING_PAYMENT"
    | "PAID_CONFIRMED"
    | "SHIPPED"
    | "RECEIVED"
    | "COMPLETED"
    | "CANCELLED";
  step: number;
  shippingAddress?: string;
  paymentProof?: string;
  buyerNote?: string;
  shippingProof?: string;
  sellerNote?: string;
  ratingBySeller?: { score: 1 | -1; comment?: string };
  ratingByBuyer?: { score: 1 | -1; comment?: string };
  chat?: string; // ID
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  sender: UserSummary;
  content: string;
  timestamp: string;
  isImage: boolean;
  isAdmin?: boolean;
}

export interface Chat {
  _id: string;
  participants: UserSummary[];
  product: string; // ID
  order: string; // ID
  messages: Message[];
}
