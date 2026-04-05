import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { AdminOrderStatusFilter } from "@/components/admin/AdminOrderStatusFilter";
import { adminClient } from "@/lib/supabase/admin";
import { Suspense } from "react";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const SUMMARY_STATUSES = [
  "pending_payment",
  "paid",
  "printing",
  "shipped",
  "delivered",
  "cancelled",
  "scheduled",
  "ready_to_print",
] as const;

function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8);
}

function designTitleFromRow(
  designs: { title: string } | null,
  personalization: unknown,
): string {
  if (designs?.title) return designs.title;
  if (personalization && typeof personalization === "object" && !Array.isArray(personalization)) {
    const t = (personalization as Record<string, unknown>).designTitle;
    if (typeof t === "string") return t;
  }
  return "—";
}

type OrderRow = {
  id: string;
  user_id: string | null;
  status: string;
  created_at: string | null;
  scheduled_send_date: string | null;
  amount_charged: number | null;
  print_job_id: string | null;
  tracking_number: string | null;
  personalization: unknown;
  designs: { title: string } | { title: string }[] | null;
  users: { email: string | null } | { email: string | null }[] | null;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const statusRaw = raw.status;
  const statusFilter =
    typeof statusRaw === "string"
      ? statusRaw.trim()
      : Array.isArray(statusRaw)
        ? statusRaw[0]?.trim() ?? ""
        : "";

  const { data: statusRows, error: statusErr } = await adminClient
    .from("orders")
    .select("status");

  if (statusErr) {
    console.error("[admin/orders] status fetch", statusErr);
  }

  const statusCounts: Record<string, number> = {};
  for (const row of statusRows ?? []) {
    const s = (row as { status: string }).status;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  let query = adminClient
    .from("orders")
    .select(
      `
      id,
      user_id,
      status,
      created_at,
      scheduled_send_date,
      amount_charged,
      print_job_id,
      tracking_number,
      personalization,
      designs ( title ),
      users ( email )
    `,
    )
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: orderRows, error: ordersErr } = await query;

  if (ordersErr) {
    console.error("[admin/orders] orders fetch", ordersErr);
  }

  const orders = (orderRows ?? []) as OrderRow[];

  function formatMoney(n: number | null) {
    if (n == null || !Number.isFinite(n)) return "—";
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatDt(iso: string | null) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Orders
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          All marketplace orders (service role).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_STATUSES.map((s) => (
          <div
            key={s}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {s.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {statusCounts[s] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          All orders
        </h2>
        <Suspense fallback={null}>
          <AdminOrderStatusFilter />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-3" scope="col">
                ID
              </th>
              <th className="px-3 py-3" scope="col">
                User
              </th>
              <th className="px-3 py-3" scope="col">
                Design
              </th>
              <th className="px-3 py-3" scope="col">
                Status
              </th>
              <th className="px-3 py-3" scope="col">
                Created
              </th>
              <th className="px-3 py-3" scope="col">
                Send date
              </th>
              <th className="px-3 py-3" scope="col">
                Amount
              </th>
              <th className="px-3 py-3" scope="col">
                Print job
              </th>
              <th className="px-3 py-3" scope="col">
                Tracking
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {orders.map((o) => {
              const d = one(o.designs);
              const u = one(o.users);
              const title = designTitleFromRow(d, o.personalization);
              const amt =
                typeof o.amount_charged === "number"
                  ? o.amount_charged
                  : o.amount_charged != null
                    ? Number(o.amount_charged)
                    : null;
              return (
                <tr key={o.id} className="align-middle">
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {shortOrderId(o.id)}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-3 text-zinc-700 dark:text-zinc-300">
                    {u?.email ?? "—"}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-3 text-zinc-900 dark:text-zinc-50">
                    {title}
                  </td>
                  <td className="px-3 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDt(o.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-600 dark:text-zinc-400">
                    {o.scheduled_send_date ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatMoney(amt)}
                  </td>
                  <td className="max-w-[100px] truncate px-3 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {o.print_job_id ?? "—"}
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {o.tracking_number ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No orders match this filter.
          </p>
        ) : null}
      </div>
    </div>
  );
}
