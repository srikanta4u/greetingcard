import { runCreatorPayouts } from "@/lib/payouts/runCreatorPayouts";
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

export async function POST() {
  const admin = await assertAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  try {
    const result = await runCreatorPayouts();
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Payout run failed";
    console.error("[admin/payouts/run]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
