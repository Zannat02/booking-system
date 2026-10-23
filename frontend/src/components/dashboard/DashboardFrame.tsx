import type { ReactNode } from "react";
import Alert from "../common/Alert";
import PageHeader from "../common/PageHeader";

interface DashboardFrameProps {
  title: string;
  subtitle: string;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  children: ReactNode;
}

export default function DashboardFrame({
  title,
  subtitle,
  loading,
  error,
  onRefresh,
  children,
}: DashboardFrameProps) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={title} subtitle={subtitle} />
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      ) : (
        !error && <div className="space-y-6">{children}</div>
      )}
    </div>
  );
}