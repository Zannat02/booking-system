import api from "./api";
import type { ApiResponse, Payment } from "../types";


export const payForBooking = async (
  bookingId: string,
  simulateFailure = false
): Promise<Payment> => {
  const response = await api.post<ApiResponse<Payment>>("/payments", {
    bookingId,
    simulateFailure,
  });
  return response.data.data;
};