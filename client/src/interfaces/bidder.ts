import type { Product } from './product';

export interface BidderProfile {
  profile: {
    _id: string;
    name: string;
    email: string;
    role: 'bidder' | 'seller' | 'admin';
    address?: string;
    positiveRatings: number;
    negativeRatings: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateProfileDto {
  name?: string;
  address?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RatingReceived {
  _id: string;
  type: 'seller' | 'bidder';
  rater: {
    _id: string;
    name: string;
    email: string;
  };
  ratee: string;
  score: 1 | -1;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface RateSellerDto {
  score: 1 | -1;
  comment: string;
}

export interface WatchlistItem {
  _id: string;
  user: string;
  product: Product;
  createdAt: string;
}

export interface AuctionItem extends Product {
  hasRated?: boolean;
  myRating?: {
    _id: string;
    score: 1 | -1;
    comment: string;
  };
}

export interface UpgradeRequestStatus {
  _id: string;
  user: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  expiresAt?: string;
  rejectedAt?: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestSellerUpgradeDto {
  reason: string;
}
