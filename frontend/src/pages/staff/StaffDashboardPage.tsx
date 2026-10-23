import ActivityFeed from "../../components/dashboard/ActivityFeed";
import BookingList from "../../components/dashboard/BookingList";
import DashboardFrame from "../../components/dashboard/DashboardFrame";
import DashboardSection from "../../components/dashboard/DashboardSection";
import StatCard from "../../components/dashboard/StatCard";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboard();
  const staff = data?.role === "STAFF" ? data : null;

  return (
    <DashboardFrame
      title="Staff Dashboard"
      subtitle={`Welcome back, ${user?.name}. Here is your schedule.`}
      loading={loading}
      error={error}
      onRefresh={reload}
    >
      {staff && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Today's assigned"
              value={staff.todaysAssignedBookings.count}
              tone="indigo"
            />
            <StatCard label="Upcoming" value={staff.upcomingServices.count} tone="amber" />
            <StatCard label="Completed" value={staff.completedServices.count} tone="emerald" />
          </div>

          <DashboardSection
            title="Today's assigned bookings"
            count={staff.todaysAssignedBookings.count}
            actionLabel="Manage bookings"
            actionTo="/staff/bookings"
          >
            <BookingList
              bookings={staff.todaysAssignedBookings.items}
              perspective="staff"
              emptyText="No bookings assigned to you today."
            />
          </DashboardSection>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardSection
              title="Upcoming services"
              count={staff.upcomingServices.count}
              actionLabel="View all"
              actionTo="/staff/bookings"
            >
              <BookingList
                bookings={staff.upcomingServices.items}
                perspective="staff"
                emptyText="No upcoming services."
              />
            </DashboardSection>

            <DashboardSection
              title="Completed services"
              count={staff.completedServices.count}
              actionLabel="View all"
              actionTo="/staff/bookings"
            >
              <BookingList
                bookings={staff.completedServices.items}
                perspective="staff"
                emptyText="No completed services yet."
              />
            </DashboardSection>
          </div>

          <ActivityFeed activities={staff.recentActivities} />
        </>
      )}
    </DashboardFrame>
  );
}