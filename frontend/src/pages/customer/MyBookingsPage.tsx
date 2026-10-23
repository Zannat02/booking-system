import { useEffect, useState, type ChangeEvent } from "react";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import { cancelBooking, getBookings } from "../../services/bookingService";
import { payForBooking } from "../../services/paymentService";
import type { Booking, BookingStatus, PaginationMeta } from "../../types";
import { formatDateTime, formatPrice, formatTime } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

const PAGE_SIZE = 8;

const STATUS_OPTIONS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface Result {
  key: string;
  bookings: Booking[];
  meta: PaginationMeta | null;
  error: string;
}

interface Notice {
  type: "error" | "success";
  text: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function MyBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

 
  const [now] = useState(() => Date.now());

  const key = `${status}|${page}|${refreshTick}`;
  const loading = result?.key !== key;

  useEffect(() => {
    let cancelled = false;

    getBookings({ page, limit: PAGE_SIZE, status })
      .then((response) => {
        if (!cancelled) {
          setResult({ key, bookings: response.data, meta: response.meta, error: "" });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            key,
            bookings: [],
            meta: null,
            error: getErrorMessage(err, "Could not load bookings."),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, page, status]);

  const handleStatus = (event: ChangeEvent<HTMLSelectElement>) => {
    setStatus(event.target.value as BookingStatus | "");
    setPage(1);
  };

  const canPay = (booking: Booking): boolean => {
    if (booking.type !== "ONE_TIME") return false;
    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") return false;
    const paymentStatus = booking.payment?.status;
    return !paymentStatus || paymentStatus === "FAILED" || paymentStatus === "PENDING";
  };

  const canCancel = (booking: Booking): boolean =>
    (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
    new Date(booking.slot.startTime).getTime() > now;

  const handlePay = async (booking: Booking) => {
    const confirmed = window.confirm(
      `Pay ${formatPrice(booking.price)} for ${booking.service.name}?`
    );
    if (!confirmed) return;

    setNotice(null);
    setBusyId(booking.id);

    try {
      const payment = await payForBooking(booking.id, simulateFailure);
      if (payment.status === "PAID") {
        setNotice({
          type: "success",
          text: `Payment of ${formatPrice(payment.amount)} completed for ${booking.service.name}.`,
        });
      } else {
        setNotice({
          type: "error",
          text: "Payment failed. You can try again.",
        });
      }
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err, "Payment could not be processed.") });
    } finally {
      setBusyId(null);
      setRefreshTick((tick) => tick + 1);
    }
  };

  const handleCancel = async (booking: Booking) => {
    const extra =
      booking.type === "SUBSCRIPTION"
        ? " Your service credit will be restored."
        : booking.payment?.status === "PAID"
          ? " Your payment will be refunded."
          : "";

    const confirmed = window.confirm(
      `Cancel your ${booking.service.name} booking?${extra}`
    );
    if (!confirmed) return;

    setNotice(null);
    setBusyId(booking.id);

    try {
      const { creditRestored, refunded } = await cancelBooking(booking.id);
      setNotice({
        type: "success",
        text:
          "Booking cancelled." +
          (creditRestored ? " 1 service credit restored." : "") +
          (refunded ? " Payment refunded." : ""),
      });
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err, "Could not cancel the booking.") });
    } finally {
      setBusyId(null);
      setRefreshTick((tick) => tick + 1);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Bookings"
        subtitle="Track, pay for, and manage your bookings."
      />

      {notice && (
        <div className="mb-4">
          <Alert type={notice.type} message={notice.text} />
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-60">
          <select
            value={status}
            onChange={handleStatus}
            aria-label="Filter by status"
            className={inputClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(event) => setSimulateFailure(event.target.checked)}
          />
          Demo: simulate a failed payment
        </label>
      </div>

      {result?.error && <Alert type="error" message={result.error} />}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      {!loading && result && !result.error && result.bookings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No bookings found</p>
          <p className="mt-1 text-sm text-slate-500">
            Book a slot and it will show up here.
          </p>
        </div>
      )}

      {!loading && result && result.bookings.length > 0 && (
        <>
          <div className="space-y-4">
            {result.bookings.map((booking) => {
              const busy = busyId === booking.id;
              const paymentLabel = booking.payment?.status ?? "UNPAID";

              return (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {booking.service.name}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDateTime(booking.slot.startTime)} -{" "}
                        {formatTime(booking.slot.endTime)}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Staff: {booking.slot.staff.name}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-500">
                      Type:{" "}
                      <span className="font-semibold text-slate-800">
                        {booking.type === "SUBSCRIPTION" ? "Subscription" : "One-time"}
                      </span>
                    </span>
                    <span className="text-slate-500">
                      Price:{" "}
                      <span className="font-semibold text-slate-800">
                        {booking.type === "SUBSCRIPTION"
                          ? "1 credit"
                          : formatPrice(booking.price)}
                      </span>
                    </span>
                    {booking.type === "ONE_TIME" && (
                      <span className="flex items-center gap-2 text-slate-500">
                        Payment: <StatusBadge status={paymentLabel} />
                      </span>
                    )}
                  </div>

                  {(canPay(booking) || canCancel(booking)) && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {canPay(booking) && (
                        <button
                          type="button"
                          onClick={() => handlePay(booking)}
                          disabled={busy}
                          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy
                            ? "Processing..."
                            : booking.payment?.status === "FAILED"
                              ? "Retry payment"
                              : "Pay now"}
                        </button>
                      )}
                      {canCancel(booking) && (
                        <button
                          type="button"
                          onClick={() => handleCancel(booking)}
                          disabled={busy}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel booking
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {result.meta && <Pagination meta={result.meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}