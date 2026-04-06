"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/creator/apply", label: "For Creators" },
] as const;

const linkClass =
  "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-violet-50 hover:text-violet-800 dark:text-zinc-400 dark:hover:bg-violet-950/50 dark:hover:text-violet-200";

export function PublicMarketingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-violet-100/80 bg-white/90 backdrop-blur-md dark:border-violet-900/30 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 min-w-0 shrink items-center gap-2 text-lg font-bold tracking-tight text-violet-700 dark:text-violet-300"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-sm font-extrabold text-white shadow-md shadow-violet-600/25"
            aria-hidden
          >
            A
          </span>
          <span className="truncate text-zinc-900 dark:text-white">
            AutoCard
          </span>
        </Link>

        <nav
          className="hidden md:flex md:flex-1 md:justify-center md:gap-0.5"
          aria-label="Main"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/auth/login"
            className="flex min-h-11 min-w-[44px] items-center justify-center rounded-lg px-3 text-sm font-semibold text-zinc-700 transition hover:text-violet-700 dark:text-zinc-300 dark:hover:text-violet-300"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="flex min-h-11 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            Sign up
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-800 transition hover:bg-zinc-100 md:hidden dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-expanded={menuOpen}
            aria-controls="public-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        id="public-mobile-menu"
        className={`overflow-hidden border-t border-violet-100 transition-[max-height] duration-200 ease-out md:hidden dark:border-violet-900/30 ${
          menuOpen ? "max-h-80" : "max-h-0"
        }`}
      >
        <nav
          className="flex flex-col gap-1 px-4 pb-4 pt-2"
          aria-label="Mobile"
          onClick={() => setMenuOpen(false)}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
