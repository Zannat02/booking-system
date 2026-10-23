type Tone = "indigo" | "emerald" | "amber" | "red" | "slate";

const tones: Record<Tone, string> = {
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: Tone;
}

export default function StatCard({ label, value, tone = "indigo" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>
        {label}
      </span>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}