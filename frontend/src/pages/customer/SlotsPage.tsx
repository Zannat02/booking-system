import { useEffect, useState, type ChangeEvent } from "react";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import { createBooking } from "../../services/bookingService";
import { getServices } from "../../services/catalogService";
import { getSlots } from "../../services/slotService";
import { getActiveSubscription } from "../../services/subscriptionService";
import type {
  BookingType,
  PaginationMeta,
  Service,
  Slot,
  Subscription,
} from "../../types";
import { formatDate, formatDateTime, formatPrice, formatTime } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

const PAGE_SIZE = 9;

interface Result {
  key: string;
  slots: Slot[];
  meta: PaginationMeta | null;
  error: string;
}

interface Notice {
  type: "error" | "success";
  text: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function SlotsPage() {
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);

  const [services, setServices] = useState<Service[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>("ONE_TIME");
  const [booking, setBooking] = useState(false);
  const [modalError, setModalError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const key = `${serviceId}|${date}|${page}|${refreshTick}`;
  const loading = result?.key !== key;

  // Service dropdown: ekbar load
  useEffect(() => {
    let cancelled = false;

    getServices({ limit: 100 })
      .then((response: { data: Service[] }) => {
        if (!cancelled) setServices(response.data);
      })
      .catch(() => {
        // Dropdown khali thakbe, kintu page kaj korbe
      });

    return () => {
      cancelled = true;
    };
  }, []);

 
  useEffect(() => {
    let cancelled = false;

    getActiveSubscription()
      .then((subscription) => {
        if (!cancelled) setActiveSub(subscription);
      })
      .catch(() => {
        // Subscription option disabled thakbe
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Slot list
  useEffect(() => {
    let cancelled = false;

    getSlots({ page, limit: PAGE_SIZE, serviceId, date })
      .then((response) => {
        if (!cancelled) {
          setResult({ key, slots: response.data, meta: response.meta, error: "" });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            key,
            slots: [],
            meta: null,
            error: getErrorMessage(err, "Could not load slots."),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, page, serviceId, date]);

  const handleService = (event: ChangeEvent<HTMLSelectElement>) => {
    setServiceId(event.target.value);
    setPage(1);
  };

  const handleDate = (event: ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
    setPage(1);
  };


  const getSubscriptionIssue = (slot: Slot): string => {
    if (!activeSub) return "You need an active subscription.";
    if (!activeSub.plan.services.some((item) => item.id === slot.service.id)) {
      return "This service is not included in your plan.";
    }
    if (activeSub.remainingCredits < 1) return "You have no credits left.";
    return "";
  };

  const openBooking = (slot: Slot) => {
    setNotice(null);
    setModalError("");
    setSelectedSlot(slot);
    setBookingType(getSubscriptionIssue(slot) === "" ? "SUBSCRIPTION" : "ONE_TIME");
  };

  const closeBooking = () => {
    if (!booking) setSelectedSlot(null);
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;

    setBooking(true);
    setModalError("");

    try {
      await createBooking({ slotId: selectedSlot.id, type: bookingType });

      setNotice({
        type: "success",
        text:
          bookingType === "SUBSCRIPTION"
            ? `Booked ${selectedSlot.service.name} using 1 credit.`
            : `Booked ${selectedSlot.service.name}. Payment is required before it can be confirmed.`,
      });
      setSelectedSlot(null);
    } catch (err) {
      setModalError(getErrorMessage(err, "Could not create the booking."));
    } finally {
      setBooking(false);
      // Seat count ar credit notun kore anbo (success hok ba fail)
      setRefreshTick((tick) => tick + 1);
      getActiveSubscription()
        .then(setActiveSub)
        .catch(() => {
          // Purono value-i thakbe
        });
    }
  };

  const subscriptionIssue = selectedSlot ? getSubscriptionIssue(selectedSlot) : "";

  return (
    <div>
      <PageHeader
        title="Available Slots"
        subtitle="Choose a time that works for you and book it."
      />

      {activeSub && (
        <p className="mb-4 text-sm text-slate-600">
          Subscription credits left:{" "}
          <span className="font-bold text-slate-900">
            {activeSub.remainingCredits} / {activeSub.plan.credits}
          </span>{" "}
          (valid until {formatDate(activeSub.endDate)})
        </p>
      )}

      {notice && (
        <div className="mb-4">
          <Alert type={notice.type} message={notice.text} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[260px_200px_auto]">
        <select
          value={serviceId}
          onChange={handleService}
          aria-label="Filter by service"
          className={inputClass}
        >
          <option value="">All services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={handleDate}
          aria-label="Filter by date"
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      {!loading && result && !result.error && result.slots.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No available slots</p>
          <p className="mt-1 text-sm text-slate-500">
            Try another service or date.
          </p>
        </div>
      )}

      {!loading && result && result.slots.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.slots.map((slot) => (
              <article
                key={slot.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <h2 className="text-lg font-bold text-slate-900">{slot.service.name}</h2>

                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {formatDateTime(slot.startTime)} - {formatTime(slot.endTime)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Staff: {slot.staff.name}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900">
                    {formatPrice(slot.service.price)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      slot.remainingSeats <= 1
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {slot.remainingSeats} left
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openBooking(slot)}
                  disabled={slot.remainingSeats < 1}
                  className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  {slot.remainingSeats < 1 ? "Full" : "Book this slot"}
                </button>
              </article>
            ))}
          </div>

          {result.meta && <Pagination meta={result.meta} onPageChange={setPage} />}
        </>
      )}

      {/* Booking dialog */}
      {selectedSlot && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm booking"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-extrabold text-slate-900">Confirm booking</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedSlot.service.name}
              <br />
              {formatDateTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
            </p>

            <div className="mt-5 space-y-3">
              <label
                className={`block rounded-xl border p-4 ${
                  subscriptionIssue
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
                    : bookingType === "SUBSCRIPTION"
                      ? "cursor-pointer border-indigo-500 bg-indigo-50"
                      : "cursor-pointer border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="bookingType"
                    checked={bookingType === "SUBSCRIPTION"}
                    disabled={Boolean(subscriptionIssue)}
                    onChange={() => setBookingType("SUBSCRIPTION")}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Use subscription credit
                    </p>
                    <p className="text-xs text-slate-500">
                      {subscriptionIssue || "Costs 1 credit, no payment needed."}
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`block cursor-pointer rounded-xl border p-4 ${
                  bookingType === "ONE_TIME"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="bookingType"
                    checked={bookingType === "ONE_TIME"}
                    onChange={() => setBookingType("ONE_TIME")}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">One-time booking</p>
                    <p className="text-xs text-slate-500">
                      Pay {formatPrice(selectedSlot.service.price)} after booking.
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {modalError && (
              <div className="mt-4">
                <Alert type="error" message={modalError} />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeBooking}
                disabled={booking}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={booking}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {booking ? "Booking..." : "Confirm booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}