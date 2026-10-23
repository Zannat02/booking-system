import { useEffect, useState, type ChangeEvent } from "react";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import {
  cancelBooking,
  getBookings,
  updateBookingStatus,
} from "../../services/bookingService";
import type {
  Booking,
  BookingStatus,
  BookingType,
  PaginationMeta,
} from "../../types";
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

const TYPE_OPTIONS: { value: BookingType | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "ONE_TIME", label: "One-time" },
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

export default function ManageBookingsPage() {
  const { user } = useAuth();

  const [status, setStatus] = useState<BookingStatus | "">("");
  const [type, setType] = useState<BookingType | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const key = `${status}|${type}|${date}|${page}|${refreshTick}`;
  const loading = result?.key !== key;

  useEffect(() => {
    let cancelled = false;

    getBookings({ page, limit: PAGE_SIZE, status, type, date })
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
  }, [key, page, status, type, date]);

  const handleStatus = (event: ChangeEvent<HTMLSelectElement>) => {
    setStatus(event.target.value as BookingStatus | "");
    setPage(1);
  };

  const handleType = (event: ChangeEvent<HTMLSelectElement>) => {
    setType(event.target.value as BookingType | "");
    setPage(1);
  };

  const handleDate = (event: ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
    setPage(1);
  };

  const handleAdvance = async (
    booking: Booking,
    next: "CONFIRMED" | "COMPLETED"
  ) => {
    const action = next === "CONFIRMED" ? "Confirm" : "Mark as completed";
    const confirmed = window.confirm(
      `${action}: ${booking.service.name} for ${booking.customer.name}?`
    );
    if (!confirmed) return;

    setNotice(null);
    setBusyId(booking.id);

    try {
      await updateBookingStatus(booking.id, next);
      setNotice({
        type: "success",
        text:
          next === "CONFIRMED"
            ? `Booking confirmed for ${booking.customer.name}.`
            : `Booking marked as completed for ${booking.customer.name}.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: getErrorMessage(err, "Could not update the booking."),
      });
    } finally {
      setBusyId(null);
      setRefreshTick((tick) => tick + 1);
    }
  };

  const handleCancel = async (booking: Booking) => {
    const extra =
      booking.type === "SUBSCRIPTION"
        ? " The customer's service credit will be restored."
        : booking.payment?.status === "PAID"
          ? " The payment will be refunded."
          : "";

    const confirmed = window.confirm(
      `Cancel ${booking.customer.name}'s ${booking.service.name} booking?${extra}`
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
      setNotice({
        type: "error",
        text: getErrorMessage(err, "Could not cancel the booking."),
      });
    } finally {
      setBusyId(null);
      setRefreshTick((tick) => tick + 1);
    }
  };

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle={
          user?.role === "ADMIN"
            ? "All customer bookings. Confirm, complete or cancel them."
            : "Bookings for your slots. Confirm, complete or cancel them."
        }
      />

      {notice && (
        <div className="mb-4">
          <Alert type={notice.type} message={notice.text} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[200px_200px_200px_auto]">
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
        <select
          value={type}
          onChange={handleType}
          aria-label="Filter by type"
          className={inputClass}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={handleDate}
          aria-label="Filter by slot date"
          className={inputClass}
        />
        {date && (
          <button
            type="button"
            onClick={() => {
              setDate("");
              setPage(1);
            }}
            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Clear date
          </button>
        )}
      </div>

      {result?.error && <Alert type="error" message={result.error} />}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      {!loading && result && !result.error && result.bookings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No bookings found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try changing the filters.
          </p>
        </div>
      )}

      {!loading && result && result.bookings.length > 0 && (
        <>
          <div className="space-y-4">
            {result.bookings.map((booking) => {
              const busy = busyId === booking.id;
              const isPending = booking.status === "PENDING";
              const isConfirmed = booking.status === "CONFIRMED";
              const waitingForPayment =
                isPending &&
                booking.type === "ONE_TIME" &&
                booking.payment?.status !== "PAID";

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
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-slate-500">Customer</p>
                      <p className="font-semibold text-slate-800">
                        {booking.customer.name}
                      </p>
                      <p className="text-xs text-slate-500">{booking.customer.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Staff</p>
                      <p className="font-semibold text-slate-800">
                        {booking.slot.staff.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Type / Price</p>
                      <p className="font-semibold text-slate-800">
                        {booking.type === "SUBSCRIPTION"
                          ? "Subscription (1 credit)"
                          : `One-time, ${formatPrice(booking.price)}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Payment</p>
                      {booking.type === "ONE_TIME" ? (
                        <StatusBadge status={booking.payment?.status ?? "UNPAID"} />
                      ) : (
                        <p className="font-semibold text-slate-800">Not required</p>
                      )}
                    </div>
                  </div>

                  {(isPending || isConfirmed) && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-3">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleAdvance(booking, "CONFIRMED")}
                            disabled={busy || waitingForPayment}
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}
                        {isConfirmed && (
                          <button
                            type="button"
                            onClick={() => handleAdvance(booking, "COMPLETED")}
                            disabled={busy}
                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Mark completed
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancel(booking)}
                          disabled={busy}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel booking
                        </button>
                      </div>
                      {waitingForPayment && (
                        <p className="mt-2 text-xs text-amber-700">
                          Waiting for the customer&apos;s payment before this can be
                          confirmed.
                        </p>
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