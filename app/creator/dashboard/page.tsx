import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function shortOrderId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.replace(/-/g, "").slice(0, 8);
}

function monthUtcRange(now: Date): { start: Date; end: Date } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0)),
  };
}

function formatMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ledgerStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
    case "eligible":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
    case "paid":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
    case "reversed":
      return "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200";
    default:
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
  }
}

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/creator/dashboard");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id, total_paid_out")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Creator
            </span>
            <Link
              href="/creator/designs"
              className="text-sm text-violet-600 hover:underline dark:text-violet-400"
            >
              Designs
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Creator dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You need a creator profile to see earnings and payouts.
          </p>
          <Link
            href="/creator/apply"
            className="mt-6 inline-flex w-fit rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Apply to become a creator
          </Link>
        </main>
      </div>
    );
  }

  const creatorId = creator.id as string;
  const totalPaidOut = num(creator.total_paid_out);

  const { data: pendingRows } = await adminClient
    .from("creator_earnings_ledger")
    .select("amount")
    .eq("creator_id", creatorId)
    .in("status", ["pending", "eligible"]);

  const pendingEarnings = (pendingRows ?? []).reduce(
    (s, r) => s + num((r as { amount: unknown }).amount),
    0,
  );

  const { data: designRows } = await adminClient
    .from("designs")
    .select("id, title, status, front_image_url")
    .eq("creator_id", creatorId);

  const designs = (designRows ?? []) as {
    id: string;
    title: string;
    status: string;
    front_image_url: string;
  }[];
  const designIds = designs.map((d) => d.id);
  const activeDesignCount = designs.filter((d) => d.status === "active").length;
  const pendingDesignCount = designs.filter((d) => d.status === "pending").length;
  const rejectedDesignCount = designs.filter(
    (d) => d.status === "rejected",
  ).length;

  const { start: monthStart, end: monthEnd } = monthUtcRange(new Date());
  let monthSalesCount = 0;
  if (designIds.length > 0) {
    const { data: orderRows } = await adminClient
      .from("orders")
      .select("id, shipped_at, created_at, status")
      .in("design_id", designIds)
      .in("status", ["shipped", "delivered"]);

    for (const o of orderRows ?? []) {
      const row = o as {
        shipped_at: string | null;
        created_at: string | null;
      };
      const t = row.shipped_at
        ? new Date(row.shipped_at).getTime()
        : row.created_at
          ? new Date(row.created_at).getTime()
          : NaN;
      if (!Number.isFinite(t)) continue;
      if (t >= monthStart.getTime() && t < monthEnd.getTime()) {
        monthSalesCount += 1;
      }
    }
  }

  const { data: ledgerForDesigns } = await adminClient
    .from("creator_earnings_ledger")
    .select("design_id, amount, status")
    .eq("creator_id", creatorId);

  const byDesign = new Map<
    string,
    { earned: number; pending: number; sold: number }
  >();
  for (const d of designs) {
    byDesign.set(d.id, { earned: 0, pending: 0, sold: 0 });
  }

  for (const r of ledgerForDesigns ?? []) {
    const row = r as {
      design_id: string | null;
      amount: unknown;
      status: string;
    };
    if (!row.design_id) continue;
    const slot = byDesign.get(row.design_id);
    if (!slot) continue;
    if (row.status !== "reversed") {
      slot.earned += num(row.amount);
    }
    if (row.status === "pending" || row.status === "eligible") {
      slot.pending += num(row.amount);
    }
  }

  if (designIds.length > 0) {
    const { data: soldRows } = await adminClient
      .from("orders")
      .select("design_id")
      .in("design_id", designIds)
      .in("status", ["shipped", "delivered"]);

    for (const r of soldRows ?? []) {
      const did = (r as { design_id: string | null }).design_id;
      if (!did) continue;
      const slot = byDesign.get(did);
      if (slot) slot.sold += 1;
    }
  }

  const designTable = [...designs]
    .map((d) => ({
      ...d,
      ...byDesign.get(d.id)!,
    }))
    .sort((a, b) => b.earned - a.earned);

  const totalEarnedLifetime = designTable.reduce((s, d) => s + d.earned, 0);

  const { data: payoutRows } = await adminClient
    .from("payouts")
    .select(
      "id, period_start, period_end, total_amount, stripe_transfer_id, status, paid_at",
    )
    .eq("creator_id", creatorId)
    .order("paid_at", { ascending: false });

  const payouts = (payoutRows ?? []) as {
    id: string;
    period_start: string | null;
    period_end: string | null;
    total_amount: unknown;
    stripe_transfer_id: string | null;
    status: string | null;
    paid_at: string | null;
  }[];

  const lastPaidAt =
    payouts.length > 0
      ? payouts.find((p) => p.paid_at)?.paid_at ?? null
      : null;

  const { data: recentLedger } = await adminClient
    .from("creator_earnings_ledger")
    .select("id, order_id, amount, status, eligible_after, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(20);

  const ledgerList = (recentLedger ?? []) as {
    id: string;
    order_id: string | null;
    amount: unknown;
    status: string;
    eligible_after: string | null;
    created_at: string | null;
  }[];

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Creator
          </span>
          <nav className="flex gap-3 text-sm font-medium">
            <span className="text-violet-600 dark:text-violet-400">Dashboard</span>
            <Link
              href="/creator/designs"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Designs
            </Link>
            <Link
              href="/"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Earnings, payouts, and sales for your marketplace designs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/creator/designs/new"
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
            >
              Upload New Design
            </Link>
            <Link
              href="/creator/dashboard#recent-ledger"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              View Orders
            </Link>
          </div>
        </div>

        <section className="grid gap-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-violet-900/30 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Total earned
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatMoney(totalEarnedLifetime)}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Lifetime (ledger)
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Pending payout
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-amber-800 dark:text-amber-200/90">
              {formatMoney(pendingEarnings)}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Pending + eligible
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Total paid out
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatMoney(totalPaidOut)}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Completed payouts
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Last payout date
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {lastPaidAt
                ? new Date(lastPaidAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Most recent transfer
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              This month&apos;s sales
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {monthSalesCount}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Shipped / delivered (UTC month)
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Design status
            </p>
            <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {activeDesignCount} active
              </span>
              {" · "}
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {pendingDesignCount} pending
              </span>
              {" · "}
              <span className="font-semibold text-red-700 dark:text-red-400">
                {rejectedDesignCount} rejected
              </span>
            </p>
          </div>
        </section>

        <div className="rounded-lg border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-900 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-200">
          Earnings are calculated at time of shipment, not purchase.
        </div>

        <section id="earnings-by-design">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Earnings by design
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Design</th>
                    <th className="px-4 py-3 text-right">Sold</th>
                    <th className="px-4 py-3 text-right">Earned</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {designTable.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                      >
                        No designs yet.{" "}
                        <Link
                          href="/creator/designs/new"
                          className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
                        >
                          Upload one
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    designTable.map((d) => (
                      <tr key={d.id} className="bg-white dark:bg-zinc-900">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                              <Image
                                src={d.front_image_url}
                                alt={d.title}
                                width={64}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              {d.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                          {d.sold}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                          {formatMoney(d.earned)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-amber-800 dark:text-amber-200/90">
                          {formatMoney(d.pending)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Payout history
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Transfer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Paid at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {payouts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400"
                      >
                        No payouts yet. Earnings are paid monthly when balance ≥ $50.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => {
                      const tid = p.stripe_transfer_id ?? "";
                      const shortTid = tid ? tid.slice(0, 12) : "—";
                      return (
                        <tr key={p.id} className="bg-white dark:bg-zinc-900">
                          <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                            {p.period_start ?? "—"} → {p.period_end ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                            {formatMoney(num(p.total_amount))}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                            {shortTid}
                          </td>
                          <td className="px-4 py-3 capitalize text-zinc-700 dark:text-zinc-300">
                            {p.status ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {p.paid_at
                              ? new Date(p.paid_at).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="recent-ledger">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recent earnings ledger
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Eligible after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {ledgerList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                      >
                        No ledger entries yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerList.map((row) => (
                      <tr key={row.id} className="bg-white dark:bg-zinc-900">
                        <td className="px-4 py-3 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                          {shortOrderId(row.order_id)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                          {formatMoney(num(row.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ledgerStatusClass(row.status)}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {row.eligible_after
                            ? new Date(row.eligible_after).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
