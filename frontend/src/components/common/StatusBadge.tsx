const styles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-200 text-slate-600",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-violet-100 text-violet-700",
  UNPAID: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-slate-200 text-slate-600",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = styles[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide ${style}`}
    >
      {label ?? status}
    </span>
  );
}