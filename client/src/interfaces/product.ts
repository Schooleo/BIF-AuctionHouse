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
  images?: string[];   
  mainImage?: string; 
  
  startingPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  
  category: Category | string; 
  seller: UserSummary | string;
  
  bidders?: Bid[]; 
  bidCount?: number;      
  highestBid?: number;    
  highestBidder?: UserSummary; 
  
  startTime: string;
  endTime: string;
  questions?: QuestionAnswer[];
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

export interface FetchProductsDto {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}

export interface PaginatedFetchDto {
  page: number;
  limit: number;
}

// Arguments for fetching products by category
export interface FetchByCategoryDto extends PaginatedFetchDto {
  categoryId?: string;
}

// Arguments for searching products
export interface SearchProductsDto extends PaginatedFetchDto {
  query: string;
  categoryId?: string;
}

export interface HomeDataResponse {
  endingSoon: Product[];
  mostBids: Product[];
  highestPrice: Product[];
}