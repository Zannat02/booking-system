import type { PaymentStatus } from "./subscription";

export type BookingType = "SUBSCRIPTION" | "ONE_TIME";
export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface BookingPayment {
  id: string;
  status: PaymentStatus;
  amount: number;
  paidAt: string | null;
}

export interface Booking {
  id: string;
  customerId: string;
  serviceId: string;
  slotId: string;
  subscriptionId: string | null;
  type: BookingType;
  status: BookingStatus;
  price: number;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string };
  service: { id: string; name: string };
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    staff: { id: string; name: string };
  };
  subscription: {
    id: string;
    remainingCredits: number;
    endDate: string;
  } | null;
  payment: BookingPayment | null;
}