export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string | undefined;
  status?: string | undefined;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
