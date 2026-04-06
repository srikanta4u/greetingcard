import Link from "next/link";

const ACCENT = "#7C3AED";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p
        className="text-sm font-semibold uppercase tracking-widest"
        style={{ color: ACCENT }}
      >
        AutoCard
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        We couldn&apos;t find that page. It may have been moved or the link
        might be wrong.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/marketplace"
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          Browse Cards
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
