"use client";

import { LogoutButton } from "@/app/dashboard/logout-button";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/upcoming", label: "Upcoming" },
  { href: "/dashboard/contacts", label: "Contacts" },
  { href: "/dashboard/schedule", label: "Schedule" },
] as const;

function linkActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({
  email,
  subscriptionActive,
}: {
  email: string;
  subscriptionActive: boolean;
}) {
  const pathname = usePathname();

  const navLinkClass = (href: string, compact = false) => {
    const active = linkActive(pathname, href);
    return compact
      ? active
        ? "flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-lg bg-violet-100 px-0.5 text-[10px] font-semibold leading-tight text-violet-900 dark:bg-violet-950 dark:text-violet-100"
        : "flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-lg px-0.5 text-[10px] font-medium leading-tight text-zinc-600 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-800"
      : active
        ? "flex min-h-11 items-center rounded-lg bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-900 dark:bg-violet-950 dark:text-violet-100"
        : "flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800";
  };

  return (
    <>
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <nav
            className="hidden flex-wrap items-center gap-x-1 gap-y-2 text-sm font-medium md:flex"
            aria-label="Dashboard"
          >
            {LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={navLinkClass(href)}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <span
              className={
                subscriptionActive
                  ? "inline-flex min-h-8 items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  : "inline-flex min-h-8 items-center rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
              }
            >
              {subscriptionActive ? "Pro" : "Free"}
            </span>
            <span className="hidden max-w-[200px] truncate text-xs text-zinc-500 sm:inline dark:text-zinc-400">
              {email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-zinc-200 bg-white p-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden dark:border-zinc-800 dark:bg-zinc-900"
        aria-label="Dashboard mobile"
      >
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={navLinkClass(href, true)}
          >
            <span className="hyphens-auto text-center">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
