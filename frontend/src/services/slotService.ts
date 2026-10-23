import api from "./api";
import type { ApiResponse, PaginatedResponse, Slot } from "../types";
import { cleanParams } from "../utils/cleanParams";

export interface SlotListParams {
  page?: number;
  limit?: number;
  serviceId?: string;
  staffId?: string;
  date?: string; // YYYY-MM-DD
  isActive?: boolean;
  order?: "asc" | "desc";
}

export interface CreateSlotData {
  serviceId: string;
  staffId?: string; // Shudhu Admin onno staff-er jonno pathate pare
  startTime: string; // ISO, timezone shoho
  endTime: string;
  capacity: number;
}

export interface UpdateSlotData {
  staffId?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  isActive?: boolean;
}

export const getSlots = async (
  params: SlotListParams = {}
): Promise<PaginatedResponse<Slot>> => {
  const response = await api.get<PaginatedResponse<Slot>>("/slots", {
    params: cleanParams(params),
  });
  return response.data;
};

export const createSlot = async (data: CreateSlotData): Promise<Slot> => {
  const response = await api.post<ApiResponse<Slot>>("/slots", data);
  return response.data.data;
};

export const updateSlot = async (
  id: string,
  data: UpdateSlotData
): Promise<Slot> => {
  const response = await api.patch<ApiResponse<Slot>>(`/slots/${id}`, data);
  return response.data.data;
};