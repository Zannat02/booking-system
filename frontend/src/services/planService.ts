import api from "./api";
import type { ApiResponse, PaginatedResponse, Plan } from "../types";
import { cleanParams } from "../utils/cleanParams";

export interface PlanListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const getPlans = async (
  params: PlanListParams = {}
): Promise<PaginatedResponse<Plan>> => {
  const response = await api.get<PaginatedResponse<Plan>>("/plans", {
    params: cleanParams(params),
  });
  return response.data;
};

export const getPlanById = async (id: string): Promise<Plan> => {
  const response = await api.get<ApiResponse<Plan>>(`/plans/${id}`);
  return response.data.data;
};