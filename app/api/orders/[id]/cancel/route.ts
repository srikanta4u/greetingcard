import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const SEVENTY_TWO_H_MS = 72 * 60 * 60 * 1000;

type Ctx = { params: Promise<{ id: string }> };

function parseScheduledDate(value: string | null | undefined): Date | null {
  if (!value || typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d, 0, 0, 0, 0);
}

export async function POST(_request: Request, context: Ctx) {
  const { id: orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order, error: fetchErr } = await adminClient
    .from("orders")
    .select("id, user_id, status, scheduled_send_date")
    .eq("id", orderId.trim())
    .maybeSingle();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "scheduled") {
    return NextResponse.json(
      { error: "Only scheduled orders can be cancelled this way" },
      { status: 400 },
    );
  }

  const dispatch = parseScheduledDate(order.scheduled_send_date as string);
  if (!dispatch) {
    return NextResponse.json(
      { error: "Order has no valid dispatch date" },
      { status: 400 },
    );
  }

  const cutoff = new Date(Date.now() + SEVENTY_TWO_H_MS);
  if (dispatch.getTime() <= cutoff.getTime()) {
    return NextResponse.json(
      { error: "Cannot cancel within 72 hours of dispatch" },
      { status: 400 },
    );
  }

  const { error: updateErr } = await adminClient
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", order.id)
    .eq("user_id", user.id);

  if (updateErr) {
    console.error("[orders/cancel] update", updateErr);
    return NextResponse.json({ error: "Could not cancel order" }, {
      status: 500,
    });
  }

  return NextResponse.json({ success: true });
}
