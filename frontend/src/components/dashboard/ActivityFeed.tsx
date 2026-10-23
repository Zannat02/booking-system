import type { ActivityAction, ActivityLog } from "../../types";
import { formatDateTime } from "../../utils/format";
import DashboardSection from "./DashboardSection";

const dotColor: Record<ActivityAction, string> = {
  USER_REGISTERED: "bg-slate-400",
  SUBSCRIPTION_CREATED: "bg-violet-500",
  BOOKING_CREATED: "bg-indigo-500",
  BOOKING_CANCELLED: "bg-red-500",
  BOOKING_COMPLETED: "bg-emerald-500",
  PAYMENT_COMPLETED: "bg-emerald-500",
  REFUND_PROCESSED: "bg-amber-500",
};

const actionLabel: Record<ActivityAction, string> = {
  USER_REGISTERED: "User registered",
  SUBSCRIPTION_CREATED: "Subscription created",
  BOOKING_CREATED: "Booking created",
  BOOKING_CANCELLED: "Booking cancelled",
  BOOKING_COMPLETED: "Booking completed",
  PAYMENT_COMPLETED: "Payment completed",
  REFUND_PROCESSED: "Refund processed",
};

interface ActivityFeedProps {
  activities: ActivityLog[];
  showUser?: boolean; // Admin-er jonno: kon user korlo
}

export default function ActivityFeed({ activities, showUser = false }: ActivityFeedProps) {
  return (
    <DashboardSection title="Recent activity">
      {activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {activities.map((activity) => (
            <li key={activity.id} className="flex gap-3 py-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor[activity.action]}`}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{activity.message}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {actionLabel[activity.action]}
                  {showUser && activity.user && ` · ${activity.user.name} (${activity.user.role})`}
                  {` · ${formatDateTime(activity.createdAt)}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}