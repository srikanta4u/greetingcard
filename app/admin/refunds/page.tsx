import { RefundClaimActions } from "@/components/admin/RefundClaimActions";
import { adminClient } from "@/lib/supabase/admin";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8);
}

type OrderEmbed = {
  id: string;
  status: string | null;
  amount_charged: number | string | null;
  personalization: unknown;
  user_id: string | null;
  designs: { title: string | null } | { title: string | null }[] | null;
  users: { email: string | null } | { email: string | null }[] | null;
};

type ClaimRow = {
  id: string;
  order_id: string | null;
  user_id: string | null;
  reason: string | null;
  status: string;
  created_at: string | null;
  orders: OrderEmbed | OrderEmbed[] | null;
};

function orderFromClaim(c: ClaimRow): OrderEmbed | null {
  const o = c.orders;
  if (o == null) return null;
  return Array.isArray(o) ? (o[0] ?? null) : o;
}

function formatMoney(n: number | string | null | undefined) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function AdminRefundsPage() {
  const { data: claimsRaw, error: claimsErr } = await adminClient
    .from("refund_claims")
    .select(
      `
      id,
      order_id,
      user_id,
      reason,
      status,
      created_at,
      orders (
        id,
        status,
        amount_charged,
        personalization,
        user_id,
        designs ( title ),
        users ( email )
      )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (claimsErr) {
    console.error("[admin/refunds] claims fetch", claimsErr);
  }

  const claims = (claimsRaw ?? []) as unknown as ClaimRow[];

  const { data: allClaimsForCount, error: countErr } = await adminClient
    .from("refund_claims")
    .select("user_id, orders ( user_id )");

  if (countErr) {
    console.error("[admin/refunds] claim counts", countErr);
  }

  type CountRow = {
    user_id: string | null;
    orders:
      | { user_id: string | null }
      | { user_id: string | null }[]
      | null;
  };

  const claimsPerUser = new Map<string, number>();
  for (const row of (allClaimsForCount ?? []) as CountRow[]) {
    const ord = one(row.orders);
    const uid = row.user_id ?? ord?.user_id;
    if (!uid) continue;
    claimsPerUser.set(uid, (claimsPerUser.get(uid) ?? 0) + 1);
  }

  function abuseCountForClaim(c: ClaimRow): number {
    const order = orderFromClaim(c);
    const uid = c.user_id ?? order?.user_id;
    if (!uid) return 0;
    return claimsPerUser.get(uid) ?? 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Refund claims
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review pending requests. Approving marks the order refunded and reverses creator
          ledger rows for that order when present.
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          No pending refund claims.
        </div>
      ) : (
        <ul className="space-y-4">
          {claims.map((c) => {
            const order = orderFromClaim(c);
            const design = one(order?.designs);
            const buyer = one(order?.users);
            const title =
              design?.title?.trim() ||
              (order?.personalization &&
              typeof order.personalization === "object" &&
              !Array.isArray(order.personalization)
                ? String(
                    (order.personalization as Record<string, unknown>).designTitle ??
                      "",
                  ).trim()
                : "") ||
              "—";
            const email = buyer?.email?.trim() ?? "—";
            const abuse = abuseCountForClaim(c);
            const highlightAbuse = abuse >= 3;

            return (
              <li
                key={c.id}
                className={`rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-900 ${
                  highlightAbuse
                    ? "border-amber-400 ring-1 ring-amber-400/40 dark:border-amber-600 dark:ring-amber-600/30"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Order
                      </span>
                      <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        {order ? shortOrderId(order.id) : "—"}
                      </span>
                      {highlightAbuse ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/80 dark:text-amber-200">
                          {abuse} lifetime claims
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      <span className="font-medium">{title}</span>
                      <span className="text-zinc-500 dark:text-zinc-400"> · </span>
                      <span>{formatMoney(order?.amount_charged)}</span>
                      <span className="text-zinc-500 dark:text-zinc-400"> · </span>
                      <span className="capitalize">{order?.status ?? "—"}</span>
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Buyer:
                      </span>{" "}
                      {email}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Reason:
                      </span>{" "}
                      {c.reason?.trim() || "—"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Submitted{" "}
                      {c.created_at
                        ? new Date(c.created_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <RefundClaimActions claimId={c.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
