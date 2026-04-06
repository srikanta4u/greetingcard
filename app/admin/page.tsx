import { adminClient } from "@/lib/supabase/admin";
import Link from "next/link";

const ACCENT = "#7c3aed";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className="mt-3 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50"
        style={{ color: ACCENT }}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [
    { count: totalDesigns, error: e1 },
    { count: pendingDesigns, error: e2 },
    { count: totalOrders, error: e3 },
    { count: totalCreators, error: e4 },
  ] = await Promise.all([
    adminClient.from("designs").select("*", { count: "exact", head: true }),
    adminClient
      .from("designs")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    adminClient.from("orders").select("*", { count: "exact", head: true }),
    adminClient.from("creators").select("*", { count: "exact", head: true }),
  ]);

  if (e1) console.error("[admin] count designs", e1);
  if (e2) console.error("[admin] count pending", e2);
  if (e3) console.error("[admin] count orders", e3);
  if (e4) console.error("[admin] count creators", e4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          AutoCard admin overview — moderation, orders, and payouts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total designs"
          value={totalDesigns ?? "—"}
          hint="All designs in catalog"
        />
        <StatCard
          label="Pending approvals"
          value={pendingDesigns ?? "—"}
          hint="Awaiting review"
        />
        <StatCard
          label="Total orders"
          value={totalOrders ?? "—"}
          hint="All-time orders"
        />
        <StatCard
          label="Total creators"
          value={totalCreators ?? "—"}
          hint="Registered creator profiles"
        />
      </div>

      <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm dark:border-violet-900/30 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Quick links
        </h2>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          <li>
            <Link
              href="/admin/designs"
              className="inline-flex rounded-xl px-4 py-2 font-medium text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Review designs
            </Link>
          </li>
          <li>
            <Link
              href="/admin/orders"
              className="inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Browse orders
            </Link>
          </li>
          <li>
            <Link
              href="/admin/payouts"
              className="inline-flex rounded-xl border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Payouts
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
