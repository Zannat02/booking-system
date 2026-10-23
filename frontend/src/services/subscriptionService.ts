import api from "./api";
import type { ApiResponse, Payment, Subscription } from "../types";

export interface SubscribeResult {
  subscription: Subscription;
  payment: Payment;
}

export const subscribeToPlan = async (planId: string): Promise<SubscribeResult> => {
  const response = await api.post<ApiResponse<SubscribeResult>>("/subscriptions", {
    planId,
  });
  return response.data.data;
};

export const getActiveSubscription = async (): Promise<Subscription | null> => {
  const response = await api.get<ApiResponse<Subscription | null>>(
    "/subscriptions/my/active"
  );
  return response.data.data;
};