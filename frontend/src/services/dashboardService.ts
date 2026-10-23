import api from "./api";
import type { ApiResponse, DashboardData } from "../types";


export const getDashboard = async (): Promise<DashboardData> => {
  const response = await api.get<ApiResponse<DashboardData>>("/dashboard");
  return response.data.data;
};