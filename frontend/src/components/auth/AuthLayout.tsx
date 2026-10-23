import type { ReactNode } from "react";
import { Link } from "react-router";

const features = [
  "Easy and convenient service booking",
  "Manage subscriptions in one place",
  "Stay updated on your appointments",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Left showcase panel */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-28 top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-12 top-48 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500 text-2xl font-bold shadow-lg shadow-indigo-500/30">
            B
          </span>
          <span className="text-xl font-bold tracking-tight">
            Booking<span className="text-indigo-300">Flow</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-indigo-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            YOUR SERVICES, SIMPLIFIED
          </span>
          <h2 className="mt-7 text-5xl leading-tight font-extrabold tracking-tight xl:text-6xl">
            More time for
            <br />
            what <span className="text-indigo-300">matters.</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
            Manage your services, subscriptions, and bookings in one simple place.
            Your next appointment is just a few clicks away.
          </p>
          <div className="mt-10 space-y-5">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-400/20 text-sm text-indigo-200">
                  ✓
                </span>
                <span className="text-sm text-slate-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          © 2026 BookingFlow. Built for better everyday experiences.
        </p>
      </section>

      {/* Form side */}
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
              B
            </span>
            <span className="text-lg font-bold text-slate-900">
              Booking<span className="text-indigo-600">Flow</span>
            </span>
          </Link>
          {children}
        </div>
      </section>
    </div>
  );
}