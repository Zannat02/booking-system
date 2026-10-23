import { Link } from "react-router";
import StatusBadge from "../../components/common/StatusBadge";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import BookingList from "../../components/dashboard/BookingList";
import DashboardFrame from "../../components/dashboard/DashboardFrame";
import DashboardSection from "../../components/dashboard/DashboardSection";
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "../../hooks/useDashboard";
import { formatDate, formatDateTime, formatPrice } from "../../utils/format";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboard();
  const customer = data?.role === "CUSTOMER" ? data : null;
  const subscription = customer?.currentSubscription ?? null;

  const creditPercent = subscription
    ? Math.min(100, Math.round((subscription.remainingCredits / subscription.plan.credits) * 100))
    : 0;

  return (
    <DashboardFrame
      title="My Dashboard"
      subtitle={`Welcome back, ${user?.name}. Here is your account at a glance.`}
      loading={loading}
      error={error}
      onRefresh={reload}
    >
      {customer && (
        <>
          {/* Current subscription */}
          <DashboardSection
            title="Current subscription"
            actionLabel={subscription ? "Change plan" : "Browse plans"}
            actionTo="/customer/plans"
          >
            {subscription ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {subscription.plan.name}
                  </h3>
                  <StatusBadge status={subscription.status} />
                </div>

                <div className="mt-4">
                  <div className="flex items-end justify-between text-sm">
                    <span className="text-slate-500">Remaining credits</span>
                    <span className="font-extrabold text-slate-900">
                      {customer.remainingCredits} / {subscription.plan.credits}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${creditPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-slate-500">Started</p>
                    <p className="font-bold text-slate-900">{formatDate(subscription.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Valid until</p>
                    <p className="font-bold text-slate-900">{formatDate(subscription.endDate)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {subscription.plan.services.map((service) => (
                    <span
                      key={service.id}
                      className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                    >
                      {service.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm font-semibold text-slate-700">No active subscription</p>
                <p className="mt-1 text-sm text-slate-500">
                  Subscribe to a plan to get service credits and book without paying each time.
                </p>
                <Link
                  to="/customer/plans"
                  className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Browse plans
                </Link>
              </div>
            )}
          </DashboardSection>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Upcoming bookings */}
            <DashboardSection
              title="Upcoming bookings"
              count={customer.upcomingBookings.length}
              actionLabel="My bookings"
              actionTo="/customer/bookings"
            >
              <BookingList
                bookings={customer.upcomingBookings}
                perspective="customer"
                emptyText="No upcoming bookings. Book a slot to get started."
              />
            </DashboardSection>

            {/* Payment history */}
            <DashboardSection title="Payment history" count={customer.paymentHistory.length}>
              {customer.paymentHistory.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No payments yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {customer.paymentHistory.map((payment) => (
                    <li key={payment.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {payment.booking
                            ? payment.booking.service.name
                            : payment.subscription
                              ? `${payment.subscription.plan.name} plan`
                              : "Payment"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDateTime(payment.paidAt ?? payment.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatPrice(payment.amount)}
                        </span>
                        <StatusBadge status={payment.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>
          </div>

          <ActivityFeed activities={customer.recentActivities} />
        </>
      )}
    </DashboardFrame>
  );
}