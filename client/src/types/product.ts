export interface Product {
  _id: string;
  name: string;
  description: string;
  images: string[];
  startingPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  category: Category;
  seller: UserSummary;
  bidders: Bid[];
  startTime: string;
  endTime: string;
}

export interface Category {
  _id: string;
  name: string;
  parentCategoryId?: string;
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
