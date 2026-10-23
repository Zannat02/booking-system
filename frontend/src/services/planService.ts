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

export interface PlanInput {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  credits: number;
  serviceIds: string[];
  isActive?: boolean;
}

export const createPlan = async (data: PlanInput): Promise<Plan> => {
  const response = await api.post<ApiResponse<Plan>>("/plans", data);
  return response.data.data;
};

export const updatePlan = async (
  id: string,
  data: Partial<PlanInput>
): Promise<Plan> => {
  const response = await api.patch<ApiResponse<Plan>>(`/plans/${id}`, data);
  return response.data.data;
};