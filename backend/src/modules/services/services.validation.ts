import { z } from "zod";
import { paginationSchema, booleanQuery } from "../../utils/pagination";

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Service name must be at least 2 characters"),
  description: z.string().trim().optional(),
  price: z
    .number()
    .int("Price must be a whole number")
    .positive("Price must be greater than 0"),
  durationMinutes: z
    .number()
    .int("Duration must be a whole number")
    .min(5, "Duration must be at least 5 minutes"),
  categoryId: z.string().min(1, "Category is required"),
  isActive: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const listServicesQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  isActive: booleanQuery.optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(["createdAt", "price", "name"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;