import api from "./api";
import { cleanParams } from "../utils/cleanParams";
import type {
  ApiResponse,
  Category,
  PaginatedResponse,
  Service,
} from "../types";

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ServiceListParams extends ListParams {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "createdAt" | "price" | "name";
  order?: "asc" | "desc";
}




// ---------- Categories ----------

export const getCategories = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Category>> => {
  const response = await api.get<PaginatedResponse<Category>>("/categories", {
    params: cleanParams(params),
  });
  return response.data;
};

export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
  return response.data.data;
};

// ---------- Services ----------

export const getServices = async (
  params: ServiceListParams = {}
): Promise<PaginatedResponse<Service>> => {
  const response = await api.get<PaginatedResponse<Service>>("/services", {
    params: cleanParams(params),
  });
  return response.data;
};

export const getServiceById = async (id: string): Promise<Service> => {
  const response = await api.get<ApiResponse<Service>>(`/services/${id}`);
  return response.data.data;
};