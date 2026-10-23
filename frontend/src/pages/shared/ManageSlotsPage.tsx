import { useEffect, useState, type ChangeEvent } from "react";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import SlotFormModal from "../../components/slots/SlotFormModal";
import { useAuth } from "../../hooks/useAuth";
import { getServices } from "../../services/catalogService";
import { getSlots, updateSlot } from "../../services/slotService";
import { getStaffMembers } from "../../services/userService";
import type { AuthUser, PaginationMeta, Service, Slot } from "../../types";
import { formatDateTime, formatPrice, formatTime } from "../../utils/format";
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
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function ManageSlotsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "", "active", "inactive"
  const [staffId, setStaffId] = useState("");
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);

  const [services, setServices] = useState<Service[]>([]);
  const [staffMembers, setStaffMembers] = useState<AuthUser[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const [formState, setFormState] = useState<{ slot: Slot | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

 
  const [now] = useState(() => Date.now());

  const key = `${serviceId}|${date}|${activeFilter}|${staffId}|${page}|${refreshTick}`;
  const loading = result?.key !== key;

  
  useEffect(() => {
    let cancelled = false;

    getServices({ limit: 100 })
      .then((response) => {
        if (!cancelled) setServices(response.data);
      })
      .catch(() => {
        // Dropdown khali thakbe
      });

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    getStaffMembers()
      .then((members) => {
        if (!cancelled) setStaffMembers(members);
      })
      .catch(() => {
        // Staff dropdown khali thakbe
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Slot list
  useEffect(() => {
    let cancelled = false;

    getSlots({
      page,
      limit: PAGE_SIZE,
      serviceId,
      date,
      staffId,
      isActive: activeFilter === "" ? undefined : activeFilter === "active",
    })
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
  }, [key, page, serviceId, date, staffId, activeFilter]);

  const handleServiceFilter = (event: ChangeEvent<HTMLSelectElement>) => {
    setServiceId(event.target.value);
    setPage(1);
  };

  const handleDate = (event: ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
    setPage(1);
  };

  const handleActiveFilter = (event: ChangeEvent<HTMLSelectElement>) => {
    setActiveFilter(event.target.value);
    setPage(1);
  };

  const handleStaffFilter = (event: ChangeEvent<HTMLSelectElement>) => {
    setStaffId(event.target.value);
    setPage(1);
  };

  const handleMineOnly = (event: ChangeEvent<HTMLInputElement>) => {
    setStaffId(event.target.checked && user ? user.id : "");
    setPage(1);
  };

  const handleSaved = (message: string) => {
    setFormState(null);
    setNotice({ type: "success", text: message });
    setRefreshTick((tick) => tick + 1);
  };

  const handleToggleActive = async (slot: Slot) => {
    const message = slot.isActive
      ? "Deactivate this slot? Customers will no longer be able to book it."
      : "Activate this slot so customers can book it again?";
    if (!window.confirm(message)) return;

    setNotice(null);
    setBusyId(slot.id);

    try {
      await updateSlot(slot.id, { isActive: !slot.isActive });
      setNotice({
        type: "success",
        text: slot.isActive ? "Slot deactivated." : "Slot activated.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: getErrorMessage(err, "Could not update the slot."),
      });
    } finally {
      setBusyId(null);
      setRefreshTick((tick) => tick + 1);
    }
  };

 
  const bookableServices = services.filter(
    (service) => service.isActive && service.category.isActive
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Slots"
          subtitle="Create and manage the time slots customers can book."
        />
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setFormState({ slot: null });
          }}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          + Create slot
        </button>
      </div>

      {notice && (
        <div className="mb-4">
          <Alert type={notice.type} message={notice.text} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={serviceId}
          onChange={handleServiceFilter}
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

        <select
          value={activeFilter}
          onChange={handleActiveFilter}
          aria-label="Filter by state"
          className={inputClass}
        >
          <option value="">Active and inactive</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>

        {isAdmin ? (
          <select
            value={staffId}
            onChange={handleStaffFilter}
            aria-label="Filter by staff"
            className={inputClass}
          >
            <option value="">All staff</option>
            {staffMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={staffId !== ""}
              onChange={handleMineOnly}
            />
            Only my slots
          </label>
        )}
      </div>

      {date && (
        <button
          type="button"
          onClick={() => {
            setDate("");
            setPage(1);
          }}
          className="-mt-3 mb-5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Clear date
        </button>
      )}

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
          <p className="text-sm font-semibold text-slate-700">No slots found</p>
          <p className="mt-1 text-sm text-slate-500">
            Create a slot or change the filters.
          </p>
        </div>
      )}

      {!loading && result && result.slots.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.slots.map((slot) => {
              const canManage = isAdmin || slot.staffId === user?.id;
              const isPast = new Date(slot.startTime).getTime() <= now;
              const isFull = slot.remainingSeats < 1;
              const busy = busyId === slot.id;

              return (
                <article
                  key={slot.id}
                  className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                    slot.isActive ? "border-slate-200" : "border-slate-200 opacity-75"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {!slot.isActive && <StatusBadge status="CANCELLED" label="INACTIVE" />}
                    {isFull && <StatusBadge status="PENDING" label="FULL" />}
                    {isPast && <StatusBadge status="EXPIRED" label="PAST" />}
                  </div>

                  <h2 className="mt-2 text-lg font-bold text-slate-900">
                    {slot.service.name}
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatDateTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Staff: {slot.staff.name}</p>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900">
                      {formatPrice(slot.service.price)}
                    </span>
                    <span className="text-slate-600">
                      Booked{" "}
                      <span className="font-bold text-slate-900">
                        {slot.bookedCount}/{slot.capacity}
                      </span>
                    </span>
                  </div>

                  {canManage ? (
                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNotice(null);
                          setFormState({ slot });
                        }}
                        disabled={busy}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(slot)}
                        disabled={busy}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                          slot.isActive
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {busy ? "..." : slot.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-5 text-xs text-slate-400">
                      Only the assigned staff or an admin can edit this slot.
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {result.meta && <Pagination meta={result.meta} onPageChange={setPage} />}
        </>
      )}

      {formState && (
        <SlotFormModal
          key={formState.slot?.id ?? "new"}
          slot={formState.slot}
          services={bookableServices}
          staffMembers={staffMembers}
          isAdmin={isAdmin}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}