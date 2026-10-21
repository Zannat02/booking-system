import { z } from "zod";
import { paginationSchema, booleanQuery } from "../../utils/pagination";


const ISO_WITH_TZ =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const isoDateTime = z
  .string()
  .regex(
    ISO_WITH_TZ,
    "Use ISO format with timezone, e.g. 2026-11-10T10:00:00+06:00"
  )
  .transform((value) => new Date(value))
  .refine((date) => !Number.isNaN(date.getTime()), "Invalid date/time");

const slotBase = z.object({
  serviceId: z.string().min(1, "Service is required"),
  staffId: z.string().min(1).optional(),
  startTime: isoDateTime,
  endTime: isoDateTime,
  capacity: z
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(100, "Capacity cannot exceed 100"),
});

export const createSlotSchema = slotBase.refine(
  (data) => data.endTime > data.startTime,
  { message: "endTime must be after startTime", path: ["endTime"] }
);

export const updateSlotSchema = slotBase
  .omit({ serviceId: true })
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .refine(
    (data) => !data.startTime || !data.endTime || data.endTime > data.startTime,
    { message: "endTime must be after startTime", path: ["endTime"] }
  );

export const listSlotsQuerySchema = paginationSchema.extend({
  serviceId: z.string().trim().optional(),
  staffId: z.string().trim().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
    .refine(
      (value) => !Number.isNaN(new Date(`${value}T00:00:00+06:00`).getTime()),
      "Invalid date"
    )
    .optional(),
  available: booleanQuery.optional(),
  isActive: booleanQuery.optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type ListSlotsQuery = z.infer<typeof listSlotsQuerySchema>;