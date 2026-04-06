import Link from "next/link";

export function PublicMarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-violet-100/80 bg-white/90 backdrop-blur-md dark:border-violet-900/30 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-violet-700 dark:text-violet-300"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-sm font-extrabold text-white shadow-md shadow-violet-600/25"
            aria-hidden
          >
            A
          </span>
          <span className="text-zinc-900 dark:text-white">AutoCard</span>
        </Link>
        <nav className="order-last flex w-full justify-center gap-0.5 border-t border-violet-100 pt-3 sm:order-none sm:w-auto sm:border-0 sm:pt-0 md:flex-1 md:justify-center dark:border-violet-900/30">
          <Link
            href="/marketplace"
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-violet-50 hover:text-violet-800 sm:px-3 sm:text-sm dark:text-zinc-400 dark:hover:bg-violet-950/50 dark:hover:text-violet-200"
          >
            Marketplace
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-violet-50 hover:text-violet-800 sm:px-3 sm:text-sm dark:text-zinc-400 dark:hover:bg-violet-950/50 dark:hover:text-violet-200"
          >
            Pricing
          </Link>
          <Link
            href="/creator/apply"
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-violet-50 hover:text-violet-800 sm:px-3 sm:text-sm dark:text-zinc-400 dark:hover:bg-violet-950/50 dark:hover:text-violet-200"
          >
            For Creators
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:text-violet-700 dark:text-zinc-300 dark:hover:text-violet-300"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
