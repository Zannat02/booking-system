import { useEffect, useState, type ChangeEvent } from "react";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { getCategories, getServices } from "../../services/catalogService";
import type { Category, PaginationMeta, Service } from "../../types";
import { formatDuration, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

const PAGE_SIZE = 9;

interface Result {
  key: string;
  services: Service[];
  meta: PaginationMeta | null;
  error: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export default function ServicesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortValue, setSortValue] = useState("createdAt:desc");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const search = useDebounce(searchInput.trim());

  // Ei request-er "porichoy". Result-er key er sathe mile gele data ready.
  const key = `${search}|${categoryId}|${sortValue}|${page}`;
  const loading = result?.key !== key;

  // Category dropdown: ekbar load
  useEffect(() => {
    let cancelled = false;

    getCategories({ limit: 100 })
      .then((response) => {
        if (!cancelled) setCategories(response.data);
      })
      .catch(() => {
        // Dropdown khali thakbe, kintu page kaj korbe
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Service list: filter/page bodlale abar load
  useEffect(() => {
    let cancelled = false;
    const [sortBy, order] = sortValue.split(":") as [
      "createdAt" | "price" | "name",
      "asc" | "desc",
    ];

    getServices({ page, limit: PAGE_SIZE, search, categoryId, sortBy, order })
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
  }, [key, page, search, categoryId, sortValue]);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const handleCategory = (event: ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(event.target.value);
    setPage(1);
  };

  const handleSort = (event: ChangeEvent<HTMLSelectElement>) => {
    setSortValue(event.target.value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Browse available services and pick the one you need."
      />

      {/* Filters */}
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
          value={sortValue}
          onChange={handleSort}
          aria-label="Sort services"
          className={inputClass}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="price:asc">Price: low to high</option>
          <option value="price:desc">Price: high to low</option>
          <option value="name:asc">Name: A to Z</option>
        </select>
      </div>

      {result?.error && <Alert type="error" message={result.error} />}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && result && !result.error && result.services.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No services found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different search or category.
          </p>
        </div>
      )}

      {/* Service cards */}
      {!loading && result && result.services.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.services.map((service) => (
              <article
                key={service.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {service.category.name}
                </span>
                <h2 className="mt-3 text-lg font-bold text-slate-900">
                  {service.name}
                </h2>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
                  {service.description || "No description provided."}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-base font-extrabold text-slate-900">
                    {formatPrice(service.price)}
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatDuration(service.durationMinutes)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          {result.meta && (
            <Pagination meta={result.meta} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}