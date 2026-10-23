import { useState, type FormEvent } from "react";
import Alert from "../common/Alert";
import FormField from "../common/FormField";
import {
  createSlot,
  updateSlot,
  type UpdateSlotData,
} from "../../services/slotService";
import type { AuthUser, Service, Slot } from "../../types";
import { toDhakaInputValue, toDhakaIso } from "../../utils/datetime";
import { getErrorMessage } from "../../utils/getErrorMessage";

interface SlotFormModalProps {
  slot: Slot | null; // null mane notun slot
  services: Service[];
  staffMembers: AuthUser[];
  isAdmin: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-500";

export default function SlotFormModal({
  slot,
  services,
  staffMembers,
  isAdmin,
  onClose,
  onSaved,
}: SlotFormModalProps) {
  const isEdit = slot !== null;
  const hasBookings = isEdit && slot.bookedCount > 0;

  const initialStart = slot ? toDhakaInputValue(slot.startTime) : "";
  const initialEnd = slot ? toDhakaInputValue(slot.endTime) : "";

  const [serviceId, setServiceId] = useState(slot?.serviceId ?? "");
  const [staffId, setStaffId] = useState(slot?.staffId ?? "");
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [capacity, setCapacity] = useState(String(slot?.capacity ?? 1));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

 
  const staffOptions =
    slot && !staffMembers.some((member) => member.id === slot.staffId)
      ? [...staffMembers, { id: slot.staffId, name: slot.staff.name }]
      : staffMembers;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const capacityNumber = Number(capacity);

    if (!isEdit && !serviceId) {
      setError("Please select a service.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Start and end time are required.");
      return;
    }
    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }
    if (
      !Number.isInteger(capacityNumber) ||
      capacityNumber < 1 ||
      capacityNumber > 100
    ) {
      setError("Capacity must be a whole number between 1 and 100.");
      return;
    }
    if (hasBookings && capacityNumber < slot.bookedCount) {
      setError(`Capacity cannot be lower than the ${slot.bookedCount} seat(s) already booked.`);
      return;
    }

    const startChanged = startTime !== initialStart;
    if (
      (!isEdit || startChanged) &&
      new Date(toDhakaIso(startTime)).getTime() <= Date.now()
    ) {
      setError("Start time must be in the future.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        // Shudhu je field bodleche seta pathai (na hole backend-er time rule trigger hoy)
        const payload: UpdateSlotData = {};
        if (startChanged) payload.startTime = toDhakaIso(startTime);
        if (endTime !== initialEnd) payload.endTime = toDhakaIso(endTime);
        if (capacityNumber !== slot.capacity) payload.capacity = capacityNumber;
        if (isAdmin && staffId !== slot.staffId) payload.staffId = staffId;

        if (Object.keys(payload).length === 0) {
          setError("No changes to save.");
          setSubmitting(false);
          return;
        }

        await updateSlot(slot.id, payload);
        onSaved("Slot updated.");
      } else {
        await createSlot({
          serviceId,
          staffId: isAdmin && staffId ? staffId : undefined,
          startTime: toDhakaIso(startTime),
          endTime: toDhakaIso(endTime),
          capacity: capacityNumber,
        });
        onSaved("Slot created.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the slot."));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit slot" : "Create slot"}
    >
      <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-extrabold text-slate-900">
          {isEdit ? "Edit slot" : "Create slot"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Times are in Bangladesh time (UTC+6).
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Service */}
          <div>
            <label
              htmlFor="slot-service"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Service
            </label>
            {isEdit ? (
              <input
                id="slot-service"
                value={slot.service.name}
                disabled
                className={selectClass}
              />
            ) : (
              <select
                id="slot-service"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className={selectClass}
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.category.name})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Staff (Admin only) */}
          {isAdmin && (
            <div>
              <label
                htmlFor="slot-staff"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Assigned staff
              </label>
              <select
                id="slot-staff"
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                className={selectClass}
              >
                {!isEdit && <option value="">Me (default)</option>}
                {staffOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="slot-start"
              label="Start time"
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              disabled={hasBookings}
            />
            <FormField
              id="slot-end"
              label="End time"
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              disabled={hasBookings}
            />
          </div>
          {hasBookings && (
            <p className="text-xs text-amber-700">
              This slot already has bookings, so its time cannot be changed.
            </p>
          )}

          <FormField
            id="slot-capacity"
            label="Capacity"
            type="number"
            min={hasBookings ? slot.bookedCount : 1}
            max={100}
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
          />

          {error && <Alert type="error" message={error} />}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create slot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}