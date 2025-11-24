export type SortKey =
  | "endDesc"
  | "endAsc"
  | "priceAsc"
  | "priceDesc"
  | "createdDesc"
  | "relevance";

export interface SearchParams {
  q: string;
  page: number;
  limit: number;
  sort:
    | "createdDesc"
    | "endDesc"
    | "endAsc"
    | "priceAsc"
    | "priceDesc"
    | "relevance";
  category?: string | undefined;
  newMinutes?: number | undefined;
}
