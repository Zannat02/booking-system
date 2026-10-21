import { BookingStatus } from "@prisma/client";

export const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  CONFIRMED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export const canTransition = (from: BookingStatus, to: BookingStatus) =>
  allowedTransitions[from].includes(to);