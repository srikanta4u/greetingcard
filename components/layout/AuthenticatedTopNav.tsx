"use client";

import { LogoutButton } from "@/app/dashboard/logout-button";
import Link from "next/link";

export function AuthenticatedTopNav({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-violet-100/80 bg-white/90 backdrop-blur-md dark:border-violet-900/30 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
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
        <nav className="order-last flex w-full flex-wrap justify-center gap-0.5 border-t border-violet-100 pt-3 sm:order-none sm:w-auto sm:flex-1 sm:border-0 sm:pt-0 md:justify-center dark:border-violet-900/30">
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
          <Link
            href="/dashboard"
            className="rounded-lg px-2.5 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 sm:px-3 sm:text-sm dark:text-violet-300 dark:hover:bg-violet-950/50"
          >
            Dashboard
          </Link>
        </nav>
        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
          <span className="hidden max-w-[160px] truncate text-xs text-zinc-500 dark:text-zinc-400 sm:inline">
            {email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
