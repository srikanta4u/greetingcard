import { randomUUID } from "crypto";

import { sendEmail } from "@/lib/email/send";
import { creatorPayoutPaid } from "@/lib/email/templates";
import { adminClient } from "@/lib/supabase/admin";

const MIN_PAYOUT_USD = 50;

export type RunCreatorPayoutsResult = {
  processed: number;
  skipped: number;
  total_paid: number;
};

type LedgerRow = {
  id: string;
  creator_id: string;
  amount: number | string;
};

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstOfMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
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

async function insertPayoutJobLog(row: {
  evaluated: number;
  dispatched: number;
  skipped: number;
  notes: string;
}): Promise<void> {
  const { error } = await adminClient.from("job_logs").insert({
    run_at: new Date().toISOString(),
    evaluated: row.evaluated,
    dispatched: row.dispatched,
    skipped: row.skipped,
    notes: row.notes,
  });
  if (error) {
    console.error("[payouts] job_logs insert failed:", error);
  }
}

async function update1099Flags(now: Date): Promise<void> {
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const { data: creators, error: cErr } = await adminClient
    .from("creators")
    .select("id");

  if (cErr || !creators?.length) {
    if (cErr) console.error("[payouts] creators list for 1099", cErr);
    return;
  }

  for (const c of creators as { id: string }[]) {
    const { data: py, error: pErr } = await adminClient
      .from("payouts")
      .select("total_amount")
      .eq("creator_id", c.id)
      .gte("paid_at", yearStart);

    if (pErr) {
      console.error("[payouts] 1099 sum", pErr);
      continue;
    }

    const ytd = (py ?? []).reduce(
      (s, row) => s + num((row as { total_amount?: unknown }).total_amount),
      0,
    );

    if (ytd > 600) {
      const { error: uErr } = await adminClient
        .from("creators")
        .update({ flag_1099k: true })
        .eq("id", c.id);
      if (uErr) {
        console.error("[payouts] flag_1099k update", uErr);
      }
    }
  }
}

/**
 * Monthly creator payout run (mock Stripe transfer in logs).
 */
export async function runCreatorPayouts(): Promise<RunCreatorPayoutsResult> {
  const now = new Date();
  const periodStart = firstOfMonth(now);
  const periodEnd = ymd(now);

  const { data: ledgerRows, error: ledErr } = await adminClient
    .from("creator_earnings_ledger")
    .select("id, creator_id, amount")
    .eq("status", "eligible")
    .lt("eligible_after", now.toISOString());

  if (ledErr) {
    await insertPayoutJobLog({
      evaluated: 0,
      dispatched: 0,
      skipped: 0,
      notes: JSON.stringify({
        type: "creator_payouts",
        error: ledErr.message,
      }),
    });
    throw ledErr;
  }

  const rows = (ledgerRows ?? []) as LedgerRow[];
  const groups = new Map<string, { ids: string[]; sum: number }>();

  for (const r of rows) {
    if (!r.creator_id) continue;
    const g = groups.get(r.creator_id) ?? { ids: [], sum: 0 };
    g.ids.push(r.id);
    g.sum += num(r.amount);
    groups.set(r.creator_id, g);
  }

  let processed = 0;
  let skipped = 0;
  let total_paid = 0;
  const detailLog: Record<string, unknown>[] = [];

  for (const [creatorId, { ids, sum }] of groups) {
    if (sum < MIN_PAYOUT_USD) {
      skipped += 1;
      detailLog.push({ creatorId, action: "below_minimum", sum });
      continue;
    }

    console.log("MOCK TRANSFER:", { creatorId, amount: sum });

    const stripe_transfer_id = `mock-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const { error: payErr } = await adminClient.from("payouts").insert({
      creator_id: creatorId,
      total_amount: sum,
      orders_count: ids.length,
      stripe_transfer_id,
      status: "paid",
      period_start: periodStart,
      period_end: periodEnd,
      paid_at: now.toISOString(),
    });

    if (payErr) {
      console.error("[payouts] insert payout", payErr);
      detailLog.push({ creatorId, error: payErr.message });
      continue;
    }

    const { error: ledUpErr } = await adminClient
      .from("creator_earnings_ledger")
      .update({ status: "paid", paid_at: now.toISOString() })
      .in("id", ids);

    if (ledUpErr) {
      console.error("[payouts] ledger update", ledUpErr);
      detailLog.push({ creatorId, error: ledUpErr.message });
      continue;
    }

    const { data: creator, error: crErr } = await adminClient
      .from("creators")
      .select("total_paid_out, user_id")
      .eq("id", creatorId)
      .maybeSingle();

    if (crErr || !creator) {
      console.error("[payouts] creator fetch", crErr);
    } else {
      const prev = num(
        (creator as { total_paid_out?: unknown }).total_paid_out,
      );
      const { error: totErr } = await adminClient
        .from("creators")
        .update({ total_paid_out: prev + sum })
        .eq("id", creatorId);
      if (totErr) {
        console.error("[payouts] total_paid_out", totErr);
      }

      const uid = (creator as { user_id: string | null }).user_id;
      if (uid) {
        const { data: u } = await adminClient
          .from("users")
          .select("email")
          .eq("id", uid)
          .maybeSingle();
        const emailTo = u?.email?.trim();
        if (emailTo) {
          const { subject, html } = creatorPayoutPaid({
            amount: sum,
            periodStart,
            periodEnd,
            transferId: stripe_transfer_id,
          });
          await sendEmail({ to: emailTo, subject, html });
        }
      }
    }

    processed += 1;
    total_paid += sum;
    detailLog.push({ creatorId, action: "paid", amount: sum, ids: ids.length });
  }

  await update1099Flags(now);

  await insertPayoutJobLog({
    evaluated: groups.size,
    dispatched: processed,
    skipped,
    notes: JSON.stringify({
      type: "creator_payouts",
      processed,
      skipped,
      total_paid,
      period_start: periodStart,
      period_end: periodEnd,
      detail: detailLog,
    }),
  });

  return { processed, skipped, total_paid };
}
