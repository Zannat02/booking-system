import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";
import { dateQuery } from "../../utils/dateRange";

export const createBookingSchema = z.object({
  slotId: z.string().min(1, "Slot is required"),
  type: z.enum(["SUBSCRIPTION", "ONE_TIME"]),
});

export const listBookingsQuerySchema = paginationSchema.extend({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  type: z.enum(["SUBSCRIPTION", "ONE_TIME"]).optional(),
  serviceId: z.string().trim().optional(),
  slotId: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  date: dateQuery.optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;