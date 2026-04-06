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
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: claim, error: claimErr } = await adminClient
    .from("refund_claims")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (claimErr || !claim) {
    return NextResponse.json({ error: "Refund claim not found" }, { status: 404 });
  }

  if (claim.status !== "pending") {
    return NextResponse.json(
      { error: "Claim is not pending" },
      { status: 400 },
    );
  }

  const { error: upClaim } = await adminClient
    .from("refund_claims")
    .update({ status: "denied" })
    .eq("id", id);

  if (upClaim) {
    console.error("[admin/refunds/deny] claim", upClaim);
    return NextResponse.json(
      { error: "Could not update claim" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
