import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type OrderRow = { id: string; user_id: string | null };

function scheduledDateTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function insertJobLog(
  supabase: ReturnType<typeof createClient>,
  row: {
    evaluated: number;
    dispatched: number;
    skipped: number;
    notes: string | null;
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
    console.error("[process-scheduled-cards] job_logs insert failed:", error);
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

  const today = scheduledDateTodayUtc();
  let evaluated = 0;
  let dispatched = 0;
  let skipped = 0;

  try {
    const { data: orders, error: fetchErr } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("status", "scheduled")
      .eq("scheduled_send_date", today);

    if (fetchErr) {
      throw fetchErr;
    }

    const list = (orders ?? []) as OrderRow[];
    evaluated = list.length;

    for (const order of list) {
      if (!order.user_id) {
        skipped += 1;
        const { error: upErr } = await supabase
          .from("orders")
          .update({ status: "skipped_no_subscription" })
          .eq("id", order.id);
        if (upErr) throw upErr;
        continue;
      }

      const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("subscription_active")
        .eq("id", order.user_id)
        .maybeSingle();

      if (userErr) throw userErr;

      const active = Boolean(userRow?.subscription_active);
      if (!active) {
        const { error: upErr } = await supabase
          .from("orders")
          .update({ status: "skipped_no_subscription" })
          .eq("id", order.id);
        if (upErr) throw upErr;
        const { error: notifErr } = await supabase.from("notifications").insert({
          type: "card_skipped_no_subscription",
          user_id: order.user_id,
          order_id: order.id,
        });
        if (notifErr) throw notifErr;
        skipped += 1;
      } else {
        const { error: upErr } = await supabase
          .from("orders")
          .update({ status: "ready_to_print" })
          .eq("id", order.id);
        if (upErr) throw upErr;
        dispatched += 1;
      }
    }

    await insertJobLog(supabase, {
      evaluated,
      dispatched,
      skipped,
      notes: null,
    });

    return new Response(
      JSON.stringify({ evaluated, dispatched, skipped }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "Unknown error");
    await insertJobLog(supabase, {
      evaluated,
      dispatched,
      skipped,
      notes: message,
    });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
