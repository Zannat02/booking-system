import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});


export const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const getPagination = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});