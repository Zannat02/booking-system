import { useEffect, useState, type ChangeEvent } from "react";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import PlanFormModal from "../../components/plans/PlanFormModal";
import { useDebounce } from "../../hooks/useDebounce";
import { getServices } from "../../services/catalogService";
import { getPlans, updatePlan } from "../../services/planService";
import type { PaginationMeta, Plan, Service } from "../../types";
import { formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

const PAGE_SIZE = 8;

interface Result {
  key: string;
  plans: Plan[];
  meta: PaginationMeta | null;
  error: string;
}

interface Notice {
  type: "error" | "success";
  text: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function ManagePlansPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "", "active", "inactive"
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);

  const [services, setServices] = useState<Service[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  // null = modal bondho, { plan: null } = create, { plan } = edit
  const [formState, setFormState] = useState<{ plan: Plan | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const search = useDebounce(searchInput.trim());
  const key = `${search}|${activeFilter}|${page}|${refreshTick}`;
  const loading = result?.key !== key;

  // Plan-e add korar jonno active service-er list: ekbar load
  useEffect(() => {
    let cancelled = false;

    getServices({ limit: 100, isActive: true })
      .then((response) => {
        if (!cancelled) setServices(response.data);
      })
      .catch(() => {
        // Picker khali thakbe
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getPlans({
      page,
      limit: PAGE_SIZE,
      search,
      isActive: activeFilter === "" ? undefined : activeFilter === "active",
    })
      .then((response) => {
        if (!cancelled) {
          setResult({ key, plans: response.data, meta: response.meta, error: "" });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            key,
            plans: [],
            meta: null,
            error: getErrorMessage(err, "Could not load plans."),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, page, search, activeFilter]);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const handleActiveFilter = (event: ChangeEvent<HTMLSelectElement>) => {
    setActiveFilter(event.target.value);
    setPage(1);
  };

  const handleSaved = (message: string) => {
    setFormState(null);
    setNotice({ type: "success", text: message });
    setRefreshTick((tick) => tick + 1);
  };

  const handleToggleActive = async (plan: Plan) => {
    const message = plan.isActive
      ? `Deactivate "${plan.name}"? Customers will not be able to subscribe to it. Existing subscribers keep their plan.`
      : `Activate "${plan.name}"?`;
    if (!window.confirm(message)) return;

    setNotice(null);
    setBusyId(plan.id);

    try {
      await updatePlan(plan.id, { isActive: !plan.isActive });
      setNotice({
        type: "success",
        text: plan.isActive ? "Plan deactivated." : "Plan activated.",
      });
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err, "Could not update the plan.") });
    } finally {
      setBusyId(null);
      setRefreshTick((tick) => tick + 1);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Subscription Plans"
          subtitle="Create the plans customers can subscribe to."
        />
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setFormState({ plan: null });
          }}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          + Create plan
        </button>
      </div>

      {notice && (
        <div className="mb-4">
          <Alert type={notice.type} message={notice.text} />
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px]">
        <input
          type="search"
          value={searchInput}
          onChange={handleSearch}
          placeholder="Search plans..."
          aria-label="Search plans"
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
      </div>

      {result?.error && <Alert type="error" message={result.error} />}

      {loading && (
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      )}

      {!loading && result && !result.error && result.plans.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No plans found</p>
          <p className="mt-1 text-sm text-slate-500">Create a plan to get started.</p>
        </div>
      )}

      {!loading && result && result.plans.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Plan</th>
                  <th className="px-5 py-3 font-bold">Price</th>
                  <th className="px-5 py-3 font-bold">Validity</th>
                  <th className="px-5 py-3 font-bold">Credits</th>
                  <th className="px-5 py-3 font-bold">Services</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.plans.map((plan) => {
                  const busy = busyId === plan.id;
                  const shown = plan.services.slice(0, 3);
                  const extra = plan.services.length - shown.length;

                  return (
                    <tr key={plan.id}>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {plan.name}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatPrice(plan.price)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {plan.durationDays} days
                      </td>
                      <td className="px-5 py-4 text-slate-600">{plan.credits}</td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {shown.map((service) => (
                            <span
                              key={service.id}
                              className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                            >
                              {service.name}
                            </span>
                          ))}
                          {extra > 0 && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              +{extra} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={plan.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNotice(null);
                              setFormState({ plan });
                            }}
                            disabled={busy}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(plan)}
                            disabled={busy}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                              plan.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {busy ? "..." : plan.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {result.meta && <Pagination meta={result.meta} onPageChange={setPage} />}
        </>
      )}

      {formState && (
        <PlanFormModal
          key={formState.plan?.id ?? "new"}
          plan={formState.plan}
          services={services}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}