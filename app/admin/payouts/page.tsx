import { RunCreatorPayoutsButton } from "@/components/admin/RunCreatorPayoutsButton";
import { adminClient } from "@/lib/supabase/admin";

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseMonthKey(key: string): { y: number; m: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return { y, m: mo };
}

function monthPaidAtRange(key: string): { startIso: string; endIso: string } | null {
  const p = parseMonthKey(key);
  if (!p) return null;
  const start = new Date(Date.UTC(p.y, p.m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(p.y, p.m, 1, 0, 0, 0, 0));
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type CreatorEmbed = {
  id: string;
  flag_1099k: boolean | null;
  user_id: string | null;
  users: { email: string | null } | { email: string | null }[] | null;
};

type PayoutRow = {
  id: string;
  creator_id: string | null;
  total_amount: number | string | null;
  stripe_transfer_id: string | null;
  status: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  creators: CreatorEmbed | CreatorEmbed[] | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function embedCreator(row: PayoutRow): CreatorEmbed | null {
  const c = row.creators;
  if (c == null) return null;
  return Array.isArray(c) ? (c[0] ?? null) : c;
}

function creatorEmailFromPayout(row: PayoutRow): string {
  const cr = embedCreator(row);
  const u = one(cr?.users);
  return u?.email?.trim() ?? "—";
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const monthRaw = raw.month;
  const monthParam =
    typeof monthRaw === "string"
      ? monthRaw.trim()
      : Array.isArray(monthRaw)
        ? monthRaw[0]?.trim() ?? ""
        : "";
  const selectedMonth =
    monthParam && parseMonthKey(monthParam) ? monthParam : monthKey(new Date());

  const range = monthPaidAtRange(selectedMonth);
  const now = new Date();

  const { data: monthPayouts, error: monthErr } = range
    ? await adminClient
        .from("payouts")
        .select("total_amount, creator_id")
        .gte("paid_at", range.startIso)
        .lt("paid_at", range.endIso)
    : { data: null, error: null };

  if (monthErr) {
    console.error("[admin/payouts] month summary", monthErr);
  }

  const mp = (monthPayouts ?? []) as { total_amount: unknown; creator_id: string | null }[];
  const totalPaidMonth = mp.reduce((s, r) => s + num(r.total_amount), 0);
  const creatorsPaidMonth = new Set(
    mp.map((r) => r.creator_id).filter(Boolean),
  ).size;

  const { data: eligRows, error: eligErr } = await adminClient
    .from("creator_earnings_ledger")
    .select("creator_id, amount")
    .eq("status", "eligible")
    .lt("eligible_after", now.toISOString());

  if (eligErr) {
    console.error("[admin/payouts] eligible ledger", eligErr);
  }

  const elig = (eligRows ?? []) as { creator_id: string; amount: unknown }[];
  const eligByCreator = new Map<string, number>();
  for (const r of elig) {
    if (!r.creator_id) continue;
    eligByCreator.set(
      r.creator_id,
      (eligByCreator.get(r.creator_id) ?? 0) + num(r.amount),
    );
  }
  let pendingBelowMin = 0;
  let pendingReady = 0;
  let pendingAmount = 0;
  for (const sum of eligByCreator.values()) {
    pendingAmount += sum;
    if (sum <= 0) continue;
    if (sum < 50) pendingBelowMin += 1;
    else pendingReady += 1;
  }

  const { data: payoutRows, error: payErr } = range
    ? await adminClient
        .from("payouts")
        .select(
          `
          id,
          creator_id,
          total_amount,
          stripe_transfer_id,
          status,
          period_start,
          period_end,
          paid_at,
          creators (
            id,
            flag_1099k,
            user_id,
            users ( email )
          )
        `,
        )
        .gte("paid_at", range.startIso)
        .lt("paid_at", range.endIso)
        .order("paid_at", { ascending: false })
    : { data: null, error: null };

  if (payErr) {
    console.error("[admin/payouts] table fetch", payErr);
  }

  const tableRows = (payoutRows ?? []) as unknown as PayoutRow[];

  const monthOptions: string[] = [];
  const cur = new Date();
  for (let i = 0; i < 18; i++) {
    const d = new Date(cur.getFullYear(), cur.getMonth() - i, 1);
    monthOptions.push(monthKey(d));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Creator payouts
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Review payouts, 1099-K flags, and run the monthly transfer job (mock Stripe in
            sandbox).
          </p>
        </div>
        <RunCreatorPayoutsButton />
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Paid ({selectedMonth})
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            ${totalPaidMonth.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Creators paid ({selectedMonth})
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {creatorsPaidMonth}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Pending eligible
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            ${pendingAmount.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {pendingReady} ready (≥ $50) · {pendingBelowMin} below minimum
          </p>
        </div>
      </section>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <label
            htmlFor="month"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Filter by month (paid date)
          </label>
          <select
            id="month"
            name="month"
            defaultValue={selectedMonth}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Payouts in {selectedMonth}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Transfer ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No payouts in this month.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => {
                  const email = creatorEmailFromPayout(row);
                  const flag1099 = Boolean(embedCreator(row)?.flag_1099k);
                  return (
                    <tr
                      key={row.id}
                      className={
                        flag1099
                          ? "bg-amber-50 dark:bg-amber-950/30"
                          : "bg-white dark:bg-zinc-900"
                      }
                    >
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                        <span className="font-medium">{email}</span>
                        {flag1099 ? (
                          <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                            1099-K
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        ${num(row.total_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {row.period_start ?? "—"} → {row.period_end ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {row.stripe_transfer_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {row.status ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {row.paid_at
                          ? new Date(row.paid_at).toLocaleString()
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
    </div>
  );
}
