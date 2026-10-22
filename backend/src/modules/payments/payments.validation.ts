import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";

export const payBookingSchema = z.object({
  bookingId: z.string().min(1, "Booking is required"),
  simulateFailure: z.boolean().optional(),
});

export const listPaymentsQuerySchema = paginationSchema.extend({
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  userId: z.string().trim().optional(),
});

export type PayBookingInput = z.infer<typeof payBookingSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;