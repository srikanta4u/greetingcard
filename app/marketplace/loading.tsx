function SkeletonCard() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="aspect-[4/3] w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export default function MarketplaceLoading() {
  return (
    <div className="min-h-full min-w-0 overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-2 space-y-2">
          <div className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="h-11 min-h-11 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />

        <div className="mt-6 h-11 animate-pulse rounded-xl bg-zinc-200 lg:hidden dark:bg-zinc-800" />

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="hidden w-full shrink-0 lg:block lg:w-64">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-4">
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
