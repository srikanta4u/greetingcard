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

export function DashboardNav({
  email,
  subscriptionActive,
}: {
  email: string;
  subscriptionActive: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm font-medium">
          {LINKS.map(({ href, label }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "rounded-lg bg-violet-100 px-3 py-1.5 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
                    : "rounded-lg px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3 lg:border-t-0 lg:pt-0 dark:border-zinc-800">
          <span
            className={
              subscriptionActive
                ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                : "inline-flex rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
            }
          >
            {subscriptionActive ? "Pro" : "Free"}
          </span>
          <span className="max-w-[200px] truncate text-xs text-zinc-500 dark:text-zinc-400">
            {email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
