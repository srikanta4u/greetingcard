export default function MarketplaceDesignLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />

      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-12">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="w-full shrink-0 space-y-6 lg:w-[min(100%,28rem)]">
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-32 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
