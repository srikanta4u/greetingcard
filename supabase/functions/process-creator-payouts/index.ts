import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIN_PAYOUT_USD = 50;
const FROM = "AutoCard <onboarding@resend.dev>";

type LedgerRow = {
  id: string;
  creator_id: string;
  amount: number | string;
};

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstOfMonthUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function insertJobLog(
  supabase: ReturnType<typeof createClient>,
  row: {
    evaluated: number;
    dispatched: number;
    skipped: number;
    notes: string;
  },
): Promise<void> {
  const { error } = await supabase.from("job_logs").insert({
    run_at: new Date().toISOString(),
    evaluated: row.evaluated,
    dispatched: row.dispatched,
    skipped: row.skipped,
    notes: row.notes,
  });
  if (error) {
    console.error("[process-creator-payouts] job_logs insert failed:", error);
  }
}

function payoutEmailHtml(
  amount: number,
  periodStart: string,
  periodEnd: string,
  transferId: string,
): string {
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:24px;">
  <h1 style="font-size:18px;">Payout sent</h1>
  <p>We’ve processed a creator payout for your AutoCard sales.</p>
  <p><strong>Amount:</strong> ${esc(money)}</p>
  <p><strong>Period:</strong> ${esc(periodStart)} → ${esc(periodEnd)}</p>
  <p><strong>Reference:</strong> ${esc(transferId)}</p>
  </body></html>`;
}

async function sendPayoutEmail(
  to: string,
  amount: number,
  periodStart: string,
  periodEnd: string,
  transferId: string,
): Promise<void> {
  const key = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!key) {
    console.warn("[process-creator-payouts] RESEND_API_KEY missing; skip email", to);
    return;
  }
  const subject = `You’ve been paid ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)} — AutoCard`;
  const html = payoutEmailHtml(amount, periodStart, periodEnd, transferId);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("[process-creator-payouts] Resend error", res.status, t);
  }
}

async function update1099Flags(
  supabase: ReturnType<typeof createClient>,
  now: Date,
): Promise<void> {
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();

  const { data: creators, error: cErr } = await supabase
    .from("creators")
    .select("id");

  if (cErr || !creators?.length) {
    if (cErr) console.error("[process-creator-payouts] creators for 1099", cErr);
    return;
  }

  for (const c of creators as { id: string }[]) {
    const { data: py, error: pErr } = await supabase
      .from("payouts")
      .select("total_amount")
      .eq("creator_id", c.id)
      .gte("paid_at", yearStart);

    if (pErr) {
      console.error("[process-creator-payouts] 1099 sum", pErr);
      continue;
    }

    const ytd = (py ?? []).reduce(
      (s, row) => s + num((row as { total_amount: unknown }).total_amount),
      0,
    );

    if (ytd > 600) {
      const { error: uErr } = await supabase
        .from("creators")
        .update({ flag_1099k: true })
        .eq("id", c.id);
      if (uErr) {
        console.error("[process-creator-payouts] flag_1099k", uErr);
      }
    }
  }
}

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) {
    return new Response(
      JSON.stringify({
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date();
  const periodStart = firstOfMonthUtc(now);
  const periodEnd = ymd(now);

  const { data: ledgerRows, error: ledErr } = await supabase
    .from("creator_earnings_ledger")
    .select("id, creator_id, amount")
    .eq("status", "eligible")
    .lt("eligible_after", now.toISOString());

  if (ledErr) {
    await insertJobLog(supabase, {
      evaluated: 0,
      dispatched: 0,
      skipped: 0,
      notes: JSON.stringify({
        type: "creator_payouts",
        error: ledErr.message,
      }),
    });
    return new Response(JSON.stringify({ error: ledErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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

    const stripe_transfer_id = `mock-${Date.now()}-${
      crypto.randomUUID().slice(0, 8)
    }`;

    const { error: payErr } = await supabase.from("payouts").insert({
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
      console.error("[process-creator-payouts] insert payout", payErr);
      detailLog.push({ creatorId, error: payErr.message });
      continue;
    }

    const { error: ledUpErr } = await supabase
      .from("creator_earnings_ledger")
      .update({ status: "paid", paid_at: now.toISOString() })
      .in("id", ids);

    if (ledUpErr) {
      console.error("[process-creator-payouts] ledger update", ledUpErr);
      detailLog.push({ creatorId, error: ledUpErr.message });
      continue;
    }

    const { data: creator, error: crErr } = await supabase
      .from("creators")
      .select("total_paid_out, user_id")
      .eq("id", creatorId)
      .maybeSingle();

    if (crErr || !creator) {
      console.error("[process-creator-payouts] creator fetch", crErr);
    } else {
      const prev = num(
        (creator as { total_paid_out?: unknown }).total_paid_out,
      );
      const { error: totErr } = await supabase
        .from("creators")
        .update({ total_paid_out: prev + sum })
        .eq("id", creatorId);
      if (totErr) {
        console.error("[process-creator-payouts] total_paid_out", totErr);
      }

      const uid = (creator as { user_id: string | null }).user_id;
      if (uid) {
        const { data: u } = await supabase
          .from("users")
          .select("email")
          .eq("id", uid)
          .maybeSingle();
        const emailTo = u?.email?.trim();
        if (emailTo) {
          await sendPayoutEmail(
            emailTo,
            sum,
            periodStart,
            periodEnd,
            stripe_transfer_id,
          );
        }
      }
    }

    processed += 1;
    total_paid += sum;
    detailLog.push({ creatorId, action: "paid", amount: sum, ids: ids.length });
  }

  await update1099Flags(supabase, now);

  await insertJobLog(supabase, {
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

  return new Response(
    JSON.stringify({ processed, skipped, total_paid }),
    { headers: { "Content-Type": "application/json" } },
  );
});
