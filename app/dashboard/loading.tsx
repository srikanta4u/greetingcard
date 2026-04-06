export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
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
  );
}
