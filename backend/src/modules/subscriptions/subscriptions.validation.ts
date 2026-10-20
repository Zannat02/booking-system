import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";

const statusEnum = z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]);

export const subscribeSchema = z.object({
  planId: z.string().min(1, "Plan is required"),
});

export const mySubscriptionsQuerySchema = paginationSchema.extend({
  status: statusEnum.optional(),
});

export const allSubscriptionsQuerySchema = paginationSchema.extend({
  status: statusEnum.optional(),
  userId: z.string().trim().optional(),
});

export type MySubscriptionsQuery = z.infer<typeof mySubscriptionsQuerySchema>;
export type AllSubscriptionsQuery = z.infer<typeof allSubscriptionsQuerySchema>;