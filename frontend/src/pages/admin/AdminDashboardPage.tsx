import ActivityFeed from "../../components/dashboard/ActivityFeed";
import DashboardFrame from "../../components/dashboard/DashboardFrame";
import StatCard from "../../components/dashboard/StatCard";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { formatPrice } from "../../utils/format";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboard();
  const admin = data?.role === "ADMIN" ? data : null;

  return (
    <DashboardFrame
      title="Admin Dashboard"
      subtitle={`Welcome back, ${user?.name}. Here is how the business is doing.`}
      loading={loading}
      error={error}
      onRefresh={reload}
    >
      {admin && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total customers" value={admin.stats.totalCustomers} tone="indigo" />
            <StatCard
              label="Active subscriptions"
              value={admin.stats.activeSubscriptions}
              tone="emerald"
            />
            <StatCard label="Today's bookings" value={admin.stats.todaysBookings} tone="indigo" />
            <StatCard
              label="Today's revenue"
              value={formatPrice(admin.stats.todaysRevenue)}
              tone="emerald"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Pending" value={admin.stats.pendingBookings} tone="amber" />
            <StatCard label="Confirmed" value={admin.stats.confirmedBookings} tone="indigo" />
            <StatCard label="Completed" value={admin.stats.completedBookings} tone="emerald" />
            <StatCard label="Cancelled" value={admin.stats.cancelledBookings} tone="slate" />
          </div>

          <ActivityFeed activities={admin.recentActivities} showUser />
        </>
      )}
    </DashboardFrame>
  );
}