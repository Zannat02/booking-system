import api from "./api";
import type { PaginatedResponse, Slot } from "../types";
import { cleanParams } from "../utils/cleanParams";

export interface SlotListParams {
  page?: number;
  limit?: number;
  serviceId?: string;
  staffId?: string;
  date?: string; // YYYY-MM-DD
  order?: "asc" | "desc";
}

export const getSlots = async (
  params: SlotListParams = {}
): Promise<PaginatedResponse<Slot>> => {
  const response = await api.get<PaginatedResponse<Slot>>("/slots", {
    params: cleanParams(params),
  });
  return response.data;
};