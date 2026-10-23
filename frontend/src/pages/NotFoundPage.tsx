import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <div className="text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-indigo-600">404</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}