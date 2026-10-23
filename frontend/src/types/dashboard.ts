import type { Booking, BookingStatus } from "./booking";
import type { Payment, Subscription } from "./subscription";

export type ActivityAction =
  | "USER_REGISTERED"
  | "SUBSCRIPTION_CREATED"
  | "BOOKING_CREATED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "PAYMENT_COMPLETED"
  | "REFUND_PROCESSED";

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: ActivityAction;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; role: "ADMIN" | "STAFF" | "CUSTOMER" } | null;
}

// Dashboard-er payment history-te thaka payment (booking ba plan-er shathe)
export interface PaymentRecord extends Payment {
  user: { id: string; name: string; email: string };
  booking: {
    id: string;
    status: BookingStatus;
    service: { id: string; name: string };
  } | null;
  subscription: { id: string; plan: { id: string; name: string } } | null;
}

export interface BookingGroup {
  count: number;
  items: Booking[];
}

export interface AdminDashboard {
  role: "ADMIN";
  stats: {
    totalCustomers: number;
    activeSubscriptions: number;
    todaysBookings: number;
    todaysRevenue: number;
    completedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
  };
  recentActivities: ActivityLog[];
}

export interface StaffDashboard {
  role: "STAFF";
  todaysAssignedBookings: BookingGroup;
  upcomingServices: BookingGroup;
  completedServices: BookingGroup;
  recentActivities: ActivityLog[];
}

export interface CustomerDashboard {
  role: "CUSTOMER";
  currentSubscription: Subscription | null;
  remainingCredits: number;
  upcomingBookings: Booking[];
  paymentHistory: PaymentRecord[];
  recentActivities: ActivityLog[];
}

// "role" field diye TypeScript bujhe kon shape
export type DashboardData = AdminDashboard | StaffDashboard | CustomerDashboard;