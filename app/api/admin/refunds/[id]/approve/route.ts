import { apiError } from "@/lib/apiError";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, status: 401 as const, message: "Unauthorized" };
  }
  const { data: row } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (row?.role !== "admin") {
    return { ok: false as const, status: 403 as const, message: "Forbidden" };
  }
  return { ok: true as const };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const admin = await assertAdmin();
  if (!admin.ok) {
    return apiError(admin.message, admin.status);
  }

  const { id } = await context.params;
  if (!id) {
    return apiError("Missing id", 400);
  }

  const { data: claim, error: claimErr } = await adminClient
    .from("refund_claims")
    .select("id, order_id, status")
    .eq("id", id)
    .maybeSingle();

  if (claimErr || !claim) {
    return apiError("Refund claim not found", 404);
  }

  if (claim.status !== "pending") {
    return apiError("Claim is not pending", 400);
  }

  const orderId = claim.order_id as string | null;
  if (!orderId) {
    return apiError("Claim has no order", 400);
  }

  const { error: upClaim } = await adminClient
    .from("refund_claims")
    .update({ status: "approved" })
    .eq("id", id);

  if (upClaim) {
    console.error("[admin/refunds/approve] claim", upClaim);
    return apiError("Could not update claim", 500);
  }

  const { error: upOrder } = await adminClient
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", orderId);

  if (upOrder) {
    console.error("[admin/refunds/approve] order", upOrder);
    return apiError("Could not update order", 500);
  }

  const { error: ledErr } = await adminClient
    .from("creator_earnings_ledger")
    .update({ status: "reversed" })
    .eq("order_id", orderId);

  if (ledErr) {
    console.error("[admin/refunds/approve] ledger", ledErr);
  }

  return NextResponse.json({ success: true });
}
