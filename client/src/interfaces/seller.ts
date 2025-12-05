export interface UpdateSellerProfileDto {
  name?: string;
  address?: string;
}

export interface ChangeSellerPasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ProductStat {
  _id: string;
  name: string;
  currentPrice: number;
  mainImage?: string;
  bidCount: number;
  currentBidder?: { name: string } | null;
}

export interface SellerStats {
  totalProducts: number;
  successfulAuctions: number;
  mostSuccessfulProduct: ProductStat | null;
  leastSuccessfulProduct: ProductStat | null;
  averageRating: number;
  positiveRatings: number;
  negativeRatings: number;
}

export interface SellerProfileResponse {
  profile: {
    _id: string;
    id?: string; // fallback
    name: string;
    email: string;
    role: "seller";
    address?: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: SellerStats;
}
