import { sendEmail } from "@/lib/email/send";
import { cardSkipped } from "@/lib/email/templates";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ProcessScheduledCardsResult = {
  evaluated: number;
  dispatched: number;
  skipped: number;
};

function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }
  return url;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

/** Calendar date YYYY-MM-DD in UTC (matches Postgres `date` comparison for stored values). */
export function scheduledDateTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function createServiceClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function insertJobLog(
  supabase: SupabaseClient,
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
    console.error("[processScheduledCards] job_logs insert failed:", error);
  }
}

type OrderRow = { id: string; user_id: string | null };

/**
 * Idempotent: only orders with status `scheduled` and `scheduled_send_date` = today are processed.
 */
export async function processScheduledCards(): Promise<ProcessScheduledCardsResult> {
  const supabase = createServiceClient();
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

        const { data: detail } = await supabase
          .from("orders")
          .select("personalization, contact_id")
          .eq("id", order.id)
          .maybeSingle();
        const { data: buyer } = await supabase
          .from("users")
          .select("email")
          .eq("id", order.user_id)
          .maybeSingle();
        const emailTo = buyer?.email?.trim();
        if (emailTo && detail) {
          const p =
            detail.personalization &&
            typeof detail.personalization === "object" &&
            !Array.isArray(detail.personalization)
              ? (detail.personalization as Record<string, unknown>)
              : {};
          let recipientName = "Recipient";
          if (detail.contact_id) {
            const { data: c } = await supabase
              .from("contacts")
              .select("name")
              .eq("id", detail.contact_id)
              .maybeSingle();
            if (c?.name?.trim()) recipientName = c.name.trim();
          }
          const designTitle =
            typeof p.designTitle === "string" ? p.designTitle : "Your card";
          const eventDate =
            typeof p.eventDeliveryDate === "string"
              ? p.eventDeliveryDate
              : "your event";
          const { subject, html } = cardSkipped({
            designTitle,
            recipientName,
            eventDate,
          });
          await sendEmail({ to: emailTo, subject, html });
        }

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

    return { evaluated, dispatched, skipped };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err ?? "Unknown error");
    await insertJobLog(supabase, {
      evaluated,
      dispatched,
      skipped,
      notes: message,
    });
    throw err;
  }
}
