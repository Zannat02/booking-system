interface FullPageLoaderProps {
  message?: string;
}

export default function FullPageLoader({ message = "Loading..." }: FullPageLoaderProps) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
        <p className="mt-1 text-xs text-slate-400">
          The server may take up to a minute to wake up.
        </p>
      </div>
    </div>
  );
}