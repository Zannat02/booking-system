import { z } from "zod";
import { paginationSchema, booleanQuery } from "../../utils/pagination";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters"),
  description: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});


export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const listCategoriesQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  isActive: booleanQuery.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;