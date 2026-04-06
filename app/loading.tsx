const ACCENT = "#7C3AED";

export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-6 px-4 py-20">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-zinc-200 dark:border-zinc-700"
        style={{ borderTopColor: ACCENT }}
        role="status"
        aria-label="Loading"
      />
      <div className="flex flex-col items-center gap-2">
        <p
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: ACCENT }}
        >
          AutoCard
        </p>
        <div className="h-2 w-40 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}
