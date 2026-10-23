import { useEffect, useState, type ChangeEvent } from "react";
import CategoryFormModal from "../../components/catalog/CategoryFormModal";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import { useDebounce } from "../../hooks/useDebounce";
import { getCategories, updateCategory } from "../../services/catalogService";
import type { Category, PaginationMeta } from "../../types";
import { getErrorMessage } from "../../utils/getErrorMessage";

const PAGE_SIZE = 10;

interface Result {
  key: string;
  categories: Category[];
  meta: PaginationMeta | null;
  error: string;
}

interface Notice {
  type: "error" | "success";
  text: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function ManageCategoriesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "", "active", "inactive"
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  // null = modal bondho, { category: null } = create, { category } = edit
  const [formState, setFormState] = useState<{ category: Category | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const search = useDebounce(searchInput.trim());
  const key = `${search}|${activeFilter}|${page}|${refreshTick}`;
  const loading = result?.key !== key;

  useEffect(() => {
    let cancelled = false;

    getCategories({
      page,
      limit: PAGE_SIZE,
      search,
      isActive: activeFilter === "" ? undefined : activeFilter === "active",
    })
      .then((response) => {
        if (!cancelled) {
          setResult({ key, categories: response.data, meta: response.meta, error: "" });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            key,
            categories: [],
            meta: null,
            error: getErrorMessage(err, "Could not load categories."),
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

  const handleToggleActive = async (category: Category) => {
    const message = category.isActive
      ? `Deactivate "${category.name}"? Its services will be hidden from customers.`
      : `Activate "${category.name}"?`;
    if (!window.confirm(message)) return;

    setNotice(null);
    setBusyId(category.id);

    try {
      await updateCategory(category.id, { isActive: !category.isActive });
      setNotice({
        type: "success",
        text: category.isActive ? "Category deactivated." : "Category activated.",
      });
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err, "Could not update the category.") });
    } finally {
      setBusyId(null);
      setRefreshTick((tick) => tick + 1);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Categories"
          subtitle="Group your services into categories."
        />
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setFormState({ category: null });
          }}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          + Create category
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
          placeholder="Search categories..."
          aria-label="Search categories"
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

      {!loading && result && !result.error && result.categories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No categories found</p>
          <p className="mt-1 text-sm text-slate-500">
            Create a category to get started.
          </p>
        </div>
      )}

      {!loading && result && result.categories.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Name</th>
                  <th className="px-5 py-3 font-bold">Description</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.categories.map((category) => {
                  const busy = busyId === category.id;
                  return (
                    <tr key={category.id}>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {category.name}
                      </td>
                      <td className="max-w-xs truncate px-5 py-4 text-slate-500">
                        {category.description || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={category.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNotice(null);
                              setFormState({ category });
                            }}
                            disabled={busy}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(category)}
                            disabled={busy}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                              category.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {busy ? "..." : category.isActive ? "Deactivate" : "Activate"}
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
        <CategoryFormModal
          key={formState.category?.id ?? "new"}
          category={formState.category}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}