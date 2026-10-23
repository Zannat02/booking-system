import type { Plan } from "./catalog";

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  userId: string;
  bookingId: string | null;
  subscriptionId: string | null;
  amount: number;
  status: PaymentStatus;
  transactionId: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  remainingCredits: number;
  createdAt: string;
  updatedAt: string;
  plan: Plan;
}