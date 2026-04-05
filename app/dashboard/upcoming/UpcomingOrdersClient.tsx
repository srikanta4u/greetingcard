"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type UpcomingOrderRow = {
  id: string;
  scheduled_send_date: string | null;
  personalization: unknown;
  status: string;
  designs: { front_image_url: string; title: string } | null;
  contacts: { name: string } | null;
};

const SEVENTY_TWO_H_MS = 72 * 60 * 60 * 1000;

function parseDispatchStart(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
}

function canCancelOrder(scheduledSendDate: string | null | undefined): boolean {
  const dispatch = parseDispatchStart(scheduledSendDate);
  if (!dispatch) return false;
  const cutoff = new Date(Date.now() + SEVENTY_TWO_H_MS);
  return dispatch.getTime() > cutoff.getTime();
}

function eventDateFromPersonalization(p: unknown): string | null {
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  const v = (p as Record<string, unknown>).eventDeliveryDate;
  return typeof v === "string" ? v : null;
}

function formatDateLabel(iso: string) {
  const d = parseDispatchStart(iso);
  if (!d) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UpcomingOrdersClient({
  orders: initialOrders,
}: {
  orders: UpcomingOrderRow[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(id: string) {
    if (
      !window.confirm(
        "Cancel this scheduled card? This cannot be undone after dispatch.",
      )
    ) {
      return;
    }
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not cancel.");
        return;
      }
      setOrders((prev) => prev.filter((o) => o.id !== id));
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No upcoming scheduled cards.{" "}
        <Link
          href="/dashboard/schedule"
          className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
        >
          Schedule one
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-4">
        {orders.map((o) => {
          const thumb = o.designs?.front_image_url;
          const contactName = o.contacts?.name ?? "Contact";
          const eventIso = eventDateFromPersonalization(o.personalization);
          const cancellable = canCancelOrder(o.scheduled_send_date);
          return (
            <li
              key={o.id}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-16 w-12 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                  />
                ) : (
                  <div className="h-16 w-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {o.designs?.title ?? "Card"}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {contactName}
                  </p>
                  <dl className="mt-2 grid gap-1 text-xs text-zinc-500 dark:text-zinc-500 sm:grid-cols-2">
                    <div>
                      <dt className="inline font-medium text-zinc-600 dark:text-zinc-400">
                        Event:{" "}
                      </dt>
                      <dd className="inline">
                        {eventIso ? formatDateLabel(eventIso) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-zinc-600 dark:text-zinc-400">
                        Dispatch:{" "}
                      </dt>
                      <dd className="inline">
                        {o.scheduled_send_date
                          ? formatDateLabel(o.scheduled_send_date)
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  Scheduled
                </span>
                <button
                  type="button"
                  disabled={!cancellable || busyId === o.id}
                  title={
                    cancellable
                      ? "Cancel this order"
                      : "Cannot cancel within 72 hours of dispatch"
                  }
                  onClick={() => void handleCancel(o.id)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:enabled:hover:bg-zinc-800"
                >
                  {busyId === o.id ? "Cancelling…" : "Cancel"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
