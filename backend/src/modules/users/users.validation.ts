import { z } from "zod";
import { paginationSchema } from "../../utils/pagination";

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().optional(),
});

export const listUsersQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  role: z.enum(["ADMIN", "STAFF", "CUSTOMER"]).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;