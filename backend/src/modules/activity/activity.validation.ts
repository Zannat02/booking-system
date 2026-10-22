import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";

export const listActivityQuerySchema = paginationSchema.extend({
  action: z
    .enum([
      "USER_REGISTERED",
      "SUBSCRIPTION_CREATED",
      "BOOKING_CREATED",
      "BOOKING_CANCELLED",
      "BOOKING_COMPLETED",
      "PAYMENT_COMPLETED",
      "REFUND_PROCESSED",
    ])
    .optional(),
  userId: z.string().trim().optional(),
});

export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;