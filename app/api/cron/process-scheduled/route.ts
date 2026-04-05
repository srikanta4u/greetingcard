import { processScheduledCards } from "@/lib/processScheduledCards";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

async function insertCronDispatchCombinedLog(row: {
  evaluated: number;
  dispatched: number;
  failed: number;
  notes: string;
}): Promise<void> {
  const { error } = await adminClient.from("job_logs").insert({
    run_at: new Date().toISOString(),
    evaluated: row.evaluated,
    dispatched: row.dispatched,
    skipped: row.failed,
    notes: row.notes,
  });
  if (error) {
    console.error("[cron/process-scheduled] combined job_logs insert:", error);
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const token = bearerToken(request);
  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scheduled = await processScheduledCards();

    const baseUrl = (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/$/, "");
    const dispatchSecret = process.env.DISPATCH_SECRET ?? "";

    let fulfillDispatched = 0;
    let fulfillFailed = 0;
    const dispatchMeta: Record<string, unknown> = {};

    if (!baseUrl || !dispatchSecret) {
      dispatchMeta.error =
        "Missing NEXT_PUBLIC_URL or DISPATCH_SECRET; dispatch skipped";
    } else {
      try {
        const res = await fetch(`${baseUrl}/api/fulfillment/dispatch`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${dispatchSecret}`,
          },
          cache: "no-store",
        });
        const json = (await res.json().catch(() => ({}))) as {
          dispatched?: number;
          failed?: number;
          error?: string;
        };
        dispatchMeta.httpStatus = res.status;
        dispatchMeta.body = json;
        if (res.ok) {
          fulfillDispatched =
            typeof json.dispatched === "number" ? json.dispatched : 0;
          fulfillFailed = typeof json.failed === "number" ? json.failed : 0;
        } else {
          fulfillFailed =
            typeof json.failed === "number" && json.failed > 0
              ? json.failed
              : 1;
        }
      } catch (err) {
        dispatchMeta.error =
          err instanceof Error ? err.message : "Dispatch fetch failed";
        fulfillFailed = 1;
      }
    }

    const notes = JSON.stringify({
      cron_dispatch_combined: true,
      scheduled: {
        evaluated: scheduled.evaluated,
        dispatched: scheduled.dispatched,
        skipped: scheduled.skipped,
      },
      fulfillment_dispatch: dispatchMeta,
    });

    await insertCronDispatchCombinedLog({
      evaluated: scheduled.evaluated,
      dispatched: fulfillDispatched,
      failed: fulfillFailed,
      notes,
    });

    return NextResponse.json({
      evaluated: scheduled.evaluated,
      dispatched: fulfillDispatched,
      failed: fulfillFailed,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Processing failed";
    console.error("[cron/process-scheduled]", err);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
