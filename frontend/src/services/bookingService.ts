import api from "./api";
import type {
  ApiResponse,
  Booking,
  BookingStatus,
  BookingType,
  PaginatedResponse,
} from "../types";
import { cleanParams } from "../utils/cleanParams";

export interface CreateBookingData {
  slotId: string;
  type: BookingType;
}

export interface BookingListParams {
  page?: number;
  limit?: number;
  status?: BookingStatus | "";
  type?: BookingType | "";
  serviceId?: string;
  date?: string; // YYYY-MM-DD
}

export interface CancelResult {
  booking: Booking;
  creditRestored: boolean;
  refunded: boolean;
}

export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  const response = await api.post<ApiResponse<Booking>>("/bookings", data);
  return response.data.data;
};

export const getBookings = async (
  params: BookingListParams = {}
): Promise<PaginatedResponse<Booking>> => {
  const response = await api.get<PaginatedResponse<Booking>>("/bookings", {
    params: cleanParams(params),
  });
  return response.data;
};

export const cancelBooking = async (id: string): Promise<CancelResult> => {
  const response = await api.post<ApiResponse<CancelResult>>(
    `/bookings/${id}/cancel`
  );
  return response.data.data;
};