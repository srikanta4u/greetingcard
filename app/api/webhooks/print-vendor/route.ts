import { sendEmail } from "@/lib/email/send";
import { cardShipped } from "@/lib/email/templates";
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
    .select("id, user_id, status, personalization, contact_id")
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
        shipped_at: new Date().toISOString(),
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

      const { data: buyer } = await adminClient
        .from("users")
        .select("email")
        .eq("id", order.user_id)
        .maybeSingle();
      const emailTo = buyer?.email?.trim();
      if (emailTo) {
        const p =
          order.personalization &&
          typeof order.personalization === "object" &&
          !Array.isArray(order.personalization)
            ? (order.personalization as Record<string, unknown>)
            : {};
        const designTitle =
          typeof p.designTitle === "string" ? p.designTitle : "Your card";
        let recipientName = "Recipient";
        if (order.contact_id) {
          const { data: c } = await adminClient
            .from("contacts")
            .select("name")
            .eq("id", order.contact_id)
            .maybeSingle();
          if (c?.name?.trim()) recipientName = c.name.trim();
        }
        const { subject, html } = cardShipped({
          designTitle,
          recipientName,
          trackingNumber: tracking,
          carrier,
          orderId: order.id as string,
        });
        await sendEmail({ to: emailTo, subject, html });
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
