import {
  buildPrintOrderFromRow,
  type OrderFulfillmentRow,
} from "@/lib/fulfillment/buildPrintOrder";
import { getAdapter } from "@/lib/fulfillment/index";
import type { PrintOrder } from "@/lib/fulfillment/types";
import { apiError } from "@/lib/apiError";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

async function insertFulfillmentJobLog(row: {
  evaluated: number;
  dispatched: number;
  failed: number;
  notes: string | null;
}): Promise<void> {
  const { error } = await adminClient.from("job_logs").insert({
    run_at: new Date().toISOString(),
    evaluated: row.evaluated,
    dispatched: row.dispatched,
    skipped: row.failed,
    notes: row.notes,
  });
  if (error) {
    console.error("[fulfillment/dispatch] job_logs insert failed:", error);
  }
}

export async function POST(request: Request) {
  const secret = process.env.DISPATCH_SECRET;
  if (!secret) {
    return apiError("DISPATCH_SECRET is not configured", 500);
  }

  const token = bearerToken(request);
  if (!token || token !== secret) {
    return apiError("Unauthorized", 401);
  }

  const { data: rows, error: fetchErr } = await adminClient
    .from("orders")
    .select(
      `
      id,
      personalization,
      designs ( front_image_url, back_image_url ),
      contacts ( name, address_line1, address_line2, city, state, postal_code, country )
    `,
    )
    .eq("status", "ready_to_print");

  if (fetchErr) {
    await insertFulfillmentJobLog({
      evaluated: 0,
      dispatched: 0,
      failed: 0,
      notes: fetchErr.message,
    });
    return apiError(fetchErr.message, 500);
  }

  const list = (rows ?? []) as OrderFulfillmentRow[];
  const toSubmit: { row: OrderFulfillmentRow; order: PrintOrder }[] = [];
  let buildFailed = 0;

  for (const row of list) {
    const built = buildPrintOrderFromRow(row);
    if ("error" in built) {
      buildFailed += 1;
      const { error: upErr } = await adminClient
        .from("orders")
        .update({
          status: "print_failed",
          notes: built.error,
        })
        .eq("id", row.id);
      if (upErr) {
        console.error("[fulfillment/dispatch] print_failed update", upErr);
      }
      continue;
    }
    toSubmit.push({ row, order: built.order });
  }

  let vendorAccepted = 0;
  let vendorFailed = 0;

  if (toSubmit.length > 0) {
    const adapter = getAdapter();
    const results = await adapter.submitBatch(toSubmit.map((t) => t.order));

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      const row = toSubmit[i]?.row;
      if (!row || res.orderId !== row.id) {
        console.error("[fulfillment/dispatch] result order mismatch", res);
        continue;
      }
      if (res.status === "accepted") {
        vendorAccepted += 1;
        const { error: upErr } = await adminClient
          .from("orders")
          .update({
            status: "printing",
            print_job_id: res.jobId,
            notes: null,
          })
          .eq("id", row.id);
        if (upErr) {
          console.error("[fulfillment/dispatch] printing update", upErr);
        }
      } else {
        vendorFailed += 1;
        const { error: upErr } = await adminClient
          .from("orders")
          .update({
            status: "print_failed",
            notes: res.error ?? "Print vendor rejected the job",
          })
          .eq("id", row.id);
        if (upErr) {
          console.error("[fulfillment/dispatch] print_failed update", upErr);
        }
      }
    }
  }

  const dispatched = vendorAccepted;
  const failed = buildFailed + vendorFailed;
  const evaluated = list.length;

  await insertFulfillmentJobLog({
    evaluated,
    dispatched,
    failed,
    notes: JSON.stringify({
      type: "fulfillment_dispatch",
      dispatched,
      failed,
      buildFailed,
      vendorFailed,
    }),
  });

  return NextResponse.json({ dispatched, failed });
}
