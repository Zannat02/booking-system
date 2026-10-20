import { z } from "zod";
import { paginationSchema, booleanQuery } from "../../utils/pagination";

export const createPlanSchema = z.object({
  name: z.string().trim().min(2, "Plan name must be at least 2 characters"),
  description: z.string().trim().optional(),
  price: z
    .number()
    .int("Price must be a whole number")
    .positive("Price must be greater than 0"),
  durationDays: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 day"),
  credits: z
    .number()
    .int("Credits must be a whole number")
    .min(1, "Credits must be at least 1"),
  serviceIds: z
    .array(z.string().min(1))
    .min(1, "A plan must include at least one service"),
  isActive: z.boolean().optional(),
});

export const updatePlanSchema = createPlanSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const listPlansQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  isActive: booleanQuery.optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type ListPlansQuery = z.infer<typeof listPlansQuerySchema>;