const ACCENT = "#7C3AED";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="w-full shrink-0 space-y-4 lg:w-56">
        <div
          className="h-2 w-16 rounded-full"
          style={{ backgroundColor: `${ACCENT}40` }}
        />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
        <div className="h-24 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </aside>

      <div className="min-w-0 flex-1 space-y-8">
        <div className="space-y-3">
          <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-3 h-8 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </section>

        <section className="space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-52 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </section>
      </div>
    </div>
  );
}
