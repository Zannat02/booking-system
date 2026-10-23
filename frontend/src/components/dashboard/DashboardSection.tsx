import type { ReactNode } from "react";
import { Link } from "react-router";

interface DashboardSectionProps {
  title: string;
  count?: number;
  actionLabel?: string;
  actionTo?: string;
  children: ReactNode;
}

export default function DashboardSection({
  title,
  count,
  actionLabel,
  actionTo,
  children,
}: DashboardSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {count}
            </span>
          )}
        </h2>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}