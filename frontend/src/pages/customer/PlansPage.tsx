import { useEffect, useState, type ChangeEvent } from "react";
import Alert from "../../components/common/Alert";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import { useDebounce } from "../../hooks/useDebounce";
import { getPlans } from "../../services/planService";
import {
  getActiveSubscription,
  subscribeToPlan,
} from "../../services/subscriptionService";
import type { PaginationMeta, Plan, Subscription } from "../../types";
import { formatDate, formatPrice } from "../../utils/format";
import { getErrorMessage } from "../../utils/getErrorMessage";

const PAGE_SIZE = 6;

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

export default function PlansPage() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result | null>(null);

  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const search = useDebounce(searchInput.trim());
  const key = `${search}|${page}`;
  const loading = result?.key !== key;


  useEffect(() => {
    let cancelled = false;

    getActiveSubscription()
      .then((subscription) => {
        if (!cancelled) setActiveSub(subscription);
      })
      .catch(() => {
     
      })
      .finally(() => {
        if (!cancelled) setSubLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Plan list
  useEffect(() => {
    let cancelled = false;

    getPlans({ page, limit: PAGE_SIZE, search })
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
  }, [key, page, search]);

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const handleSubscribe = async (plan: Plan) => {
    const confirmed = window.confirm(
      `Subscribe to ${plan.name} for ${formatPrice(plan.price)}?`
    );
    if (!confirmed) return;

    setNotice(null);
    setSubscribingId(plan.id);

    try {
      const { subscription, payment } = await subscribeToPlan(plan.id);
      setActiveSub(subscription);
      setNotice({
        type: "success",
        text: `You are now subscribed to ${plan.name}. Payment of ${formatPrice(payment.amount)} completed.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        text: getErrorMessage(err, "Could not complete the subscription."),
      });
    } finally {
      setSubscribingId(null);
    }
  };

  const getButtonLabel = (plan: Plan): string => {
    if (subscribingId === plan.id) return "Subscribing...";
    if (activeSub?.planId === plan.id) return "Current plan";
    if (activeSub) return "Already subscribed";
    return "Subscribe";
  };

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        subtitle="Pick a plan, get service credits, and book without paying each time."
      />

      {/* Current subscription */}
      {!subLoading && activeSub && (
        <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wide text-indigo-600 uppercase">
                Your current plan
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                {activeSub.plan.name}
              </h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {activeSub.status}
            </span>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-slate-500">Credits left</p>
              <p className="font-bold text-slate-900">
                {activeSub.remainingCredits} / {activeSub.plan.credits}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Started</p>
              <p className="font-bold text-slate-900">{formatDate(activeSub.startDate)}</p>
            </div>
            <div>
              <p className="text-slate-500">Valid until</p>
              <p className="font-bold text-slate-900">{formatDate(activeSub.endDate)}</p>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="mb-4">
          <Alert type={notice.type} message={notice.text} />
        </div>
      )}

      <div className="mb-6 max-w-md">
        <input
          type="search"
          value={searchInput}
          onChange={handleSearch}
          placeholder="Search plans..."
          aria-label="Search plans"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      {result?.error && <Alert type="error" message={result.error} />}

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      {!loading && result && !result.error && result.plans.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No plans found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different search, or check back later.
          </p>
        </div>
      )}

      {!loading && result && result.plans.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.plans.map((plan) => {
              const isCurrent = activeSub?.planId === plan.id;
              const disabled = subLoading || Boolean(activeSub) || subscribingId !== null;

              return (
                <article
                  key={plan.id}
                  className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                    isCurrent ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200"
                  }`}
                >
                  <h2 className="text-lg font-extrabold text-slate-900">{plan.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {plan.description || "No description provided."}
                  </p>

                  <p className="mt-5">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="ml-1 text-sm text-slate-500">
                      / {plan.durationDays} days
                    </span>
                  </p>

                  <div className="mt-4 inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {plan.credits} service credits
                  </div>

                  <div className="mt-5 flex-1">
                    <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                      Included services
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {plan.services.map((service) => (
                        <li
                          key={service.id}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">
                            ✓
                          </span>
                          {service.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan)}
                    disabled={disabled}
                    className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600"
                  >
                    {getButtonLabel(plan)}
                  </button>
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