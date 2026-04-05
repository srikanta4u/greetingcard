export default function MarketplaceLoading() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

        <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="h-96 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          </aside>
          <main className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="aspect-[4/3] animate-pulse bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
