import type { Booking } from "../../types";
import { formatDateTime, formatTime } from "../../utils/format";
import StatusBadge from "../common/StatusBadge";

interface BookingListProps {
  bookings: Booking[];
  perspective: "customer" | "staff";
  emptyText: string;
}

export default function BookingList({ bookings, perspective, emptyText }: BookingListProps) {
  if (bookings.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {bookings.map((booking) => (
        <li key={booking.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{booking.service.name}</p>
            <p className="mt-0.5 text-xs text-slate-600">
              {formatDateTime(booking.slot.startTime)} - {formatTime(booking.slot.endTime)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {perspective === "staff"
                ? `Customer: ${booking.customer.name}`
                : `Staff: ${booking.slot.staff.name}`}
              {" · "}
              {booking.type === "SUBSCRIPTION" ? "Subscription" : "One-time"}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </li>
      ))}
    </ul>
  );
}