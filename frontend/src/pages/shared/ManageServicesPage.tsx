import { useEffect, useState, type ChangeEvent } from "react";
import ServiceFormModal from "../../components/catalog/ServiceFormModal";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import { useDebounce } from "../../hooks/useDebounce";
import {
  getCategories,
  getServices,
  updateService,
} from "../../services/catalogService";
import type { Category, PaginationMeta, Service } from "../../types";
import { formatDuration, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

const PAGE_SIZE = 10;

interface Result {
  key: string;
  services: Service[];
  meta: PaginationMeta | null;
  error: string;
}

interface Notice {
  type: "error" | "success";
  text: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function ManageServicesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "", "active", "inactive"
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  // null = modal bondho, { service: null } = create, { service } = edit
  const [formState, setFormState] = useState<{ service: Service | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const search = useDebounce(searchInput.trim());
  const key = `${search}|${categoryId}|${activeFilter}|${page}|${refreshTick}`;
  const loading = result?.key !== key;

  // Category list (filter ar form-er jonno): ekbar load
  useEffect(() => {
    let cancelled = false;

    getCategories({ limit: 100 })
      .then((response) => {
        if (!cancelled) setCategories(response.data);
      })
      .catch(() => {
        // Dropdown khali thakbe
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getServices({
      page,
      limit: PAGE_SIZE,
      search,
      categoryId,
      isActive: activeFilter === "" ? undefined : activeFilter === "active",
    })
      .then((response) => {
        if (!cancelled) {
          setResult({ key, services: response.data, meta: response.meta, error: "" });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            key,
            services: [],
            meta: null,
            error: getErrorMessage(err, "Could not load services."),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, page, search, categoryId, activeFilter]);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const handleCategory = (event: ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(event.target.value);
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

  const handleToggleActive = async (service: Service) => {
    const message = service.isActive
      ? `Deactivate "${service.name}"? Customers will not see it and no new slots or bookings can be created for it.`
      : `Activate "${service.name}"?`;
    if (!window.confirm(message)) return;

    setNotice(null);
    setBusyId(service.id);

    try {
      await updateService(service.id, { isActive: !service.isActive });
      setNotice({
        type: "success",
        text: service.isActive ? "Service deactivated." : "Service activated.",
      });
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err, "Could not update the service.") });
    } finally {
      setBusyId(null);
      setRefreshTick((tick) => tick + 1);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Services"
          subtitle="Manage the services customers can book."
        />
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setFormState({ service: null });
          }}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          + Create service
        </button>
      </div>

      {notice && (
        <div className="mb-4">
          <Alert type={notice.type} message={notice.text} />
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px_220px]">
        <input
          type="search"
          value={searchInput}
          onChange={handleSearch}
          placeholder="Search services..."
          aria-label="Search services"
          className={inputClass}
        />
        <select
          value={categoryId}
          onChange={handleCategory}
          aria-label="Filter by category"
          className={inputClass}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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

      {!loading && result && !result.error && result.services.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No services found</p>
          <p className="mt-1 text-sm text-slate-500">
            Create a service or change the filters.
          </p>
        </div>
      )}

      {!loading && result && result.services.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Service</th>
                  <th className="px-5 py-3 font-bold">Price</th>
                  <th className="px-5 py-3 font-bold">Duration</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.services.map((service) => {
                  const busy = busyId === service.id;
                  return (
                    <tr key={service.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{service.name}</p>
                        <p className="text-xs text-slate-500">
                          {service.category.name}
                          {!service.category.isActive && " (category inactive)"}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatPrice(service.price)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDuration(service.durationMinutes)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNotice(null);
                              setFormState({ service });
                            }}
                            disabled={busy}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(service)}
                            disabled={busy}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                              service.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {busy ? "..." : service.isActive ? "Deactivate" : "Activate"}
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
        <ServiceFormModal
          key={formState.service?.id ?? "new"}
          service={formState.service}
          categories={categories}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}