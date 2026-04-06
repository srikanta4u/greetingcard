"use client";

import { OptimizedImage } from "@/app/components/OptimizedImage";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import Link from "next/link";

export type DashboardHomeRecentOrder = {
  id: string;
  status: string;
  amountCharged: number | null;
  createdAt: string | null;
  designTitle: string;
  frontImageUrl: string | null;
};

export type DashboardHomeUpcomingEvent = {
  contactId: string;
  contactName: string;
  eventId: string;
  eventType: string;
  occurrenceYmd: string;
  daysUntil: number;
};

function formatMoney(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatOrderDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatEventDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DashboardHomeClient({
  displayName,
  subscriptionActive,
  upcomingEventsCount,
  scheduledPendingCount,
  totalOrdersCount,
  upcomingEvents,
  recentOrders,
}: {
  displayName: string;
  subscriptionActive: boolean;
  upcomingEventsCount: number;
  scheduledPendingCount: number;
  totalOrdersCount: number;
  upcomingEvents: DashboardHomeUpcomingEvent[];
  recentOrders: DashboardHomeRecentOrder[];
}) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Your cards, contacts, and deliveries at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Upcoming events (30 days)
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {upcomingEventsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Scheduled cards
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {scheduledPendingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total orders
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {totalOrdersCount}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Plan
          </p>
          <p className="mt-3">
            <span
              className={
                subscriptionActive
                  ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  : "inline-flex rounded-full bg-zinc-200 px-3 py-1 text-sm font-semibold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
              }
            >
              {subscriptionActive ? "Pro" : "Free"}
            </span>
          </p>
        </div>
      </div>

      <section style={{ contentVisibility: "auto" }}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Upcoming events
          </h2>
          <Link
            href="/dashboard/schedule"
            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Schedule
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            No events in the next 30 days. Add dates on your contacts.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {upcomingEvents.map((e) => (
              <li
                key={`${e.contactId}-${e.eventId}`}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {e.contactName}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {e.eventType} · {formatEventDate(e.occurrenceYmd)}
                  </p>
                  <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
                    {e.daysUntil === 0
                      ? "Today"
                      : e.daysUntil === 1
                        ? "1 day to go"
                        : `${e.daysUntil} days to go`}
                  </p>
                </div>
                <Link
                  href="/dashboard/schedule"
                  className="inline-flex shrink-0 justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  Send a card
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ contentVisibility: "auto" }}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recent orders
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            No orders yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentOrders.map((o, idx) => (
              <li
                key={o.id}
                className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {o.frontImageUrl ? (
                  <OptimizedImage
                    src={o.frontImageUrl}
                    alt={o.designTitle}
                    fill={false}
                    width={48}
                    height={64}
                    priority={idx === 0}
                    sizes="48px"
                    className="rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                    containerClassName="shrink-0 !block overflow-hidden rounded-lg"
                  />
                ) : (
                  <div className="h-16 w-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {o.designTitle}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={o.status} />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {formatMoney(o.amountCharged)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatOrderDate(o.createdAt)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Quick links
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { href: "/dashboard/contacts", label: "Contacts" },
            { href: "/dashboard/schedule", label: "Schedule" },
            { href: "/dashboard/orders", label: "Orders" },
            { href: "/marketplace", label: "Marketplace" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-violet-300 dark:hover:bg-zinc-800"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
