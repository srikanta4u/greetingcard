import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.event !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const printJobId =
    typeof body.print_job_id === "string" ? body.print_job_id.trim() : "";
  if (!printJobId) {
    return NextResponse.json({ error: "print_job_id required" }, {
      status: 400,
    });
  }

  const { data: order, error: findErr } = await adminClient
    .from("orders")
    .select("id, user_id, status")
    .eq("print_job_id", printJobId)
    .maybeSingle();

  if (findErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (body.event === "order.shipped") {
    const tracking =
      typeof body.tracking_number === "string"
        ? body.tracking_number.trim()
        : "";
    const carrier =
      typeof body.carrier === "string" ? body.carrier.trim() : "";

    const { error: upErr } = await adminClient
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: tracking || null,
        carrier: carrier || null,
      })
      .eq("id", order.id);

    if (upErr) {
      console.error("[webhooks/print-vendor] shipped update", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    if (order.user_id) {
      const { error: nErr } = await adminClient.from("notifications").insert({
        type: "card_shipped",
        user_id: order.user_id,
        order_id: order.id,
      });
      if (nErr) {
        console.error("[webhooks/print-vendor] notification", nErr);
      }
    }

    return NextResponse.json({ received: true });
  }

  if (body.event === "order.delivered") {
    const { error: upErr } = await adminClient
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", order.id);

    if (upErr) {
      console.error("[webhooks/print-vendor] delivered update", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ error: "Unknown event" }, { status: 400 });
}
