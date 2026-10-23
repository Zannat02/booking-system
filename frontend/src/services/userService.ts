import api from "./api";
import type { AuthUser, PaginatedResponse } from "../types";

export const getStaffMembers = async (): Promise<AuthUser[]> => {
  const response = await api.get<PaginatedResponse<AuthUser>>("/users", {
    params: { role: "STAFF", limit: 100 },
  });
  return response.data.data;
};