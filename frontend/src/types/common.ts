export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Ekta item-er response: { success, message?, data }
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// List-er response: { success, data: [...], meta }
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}