import { apiError } from "@/lib/apiError";
import { runCreatorPayouts } from "@/lib/payouts/runCreatorPayouts";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type AssertAdminResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; message: string };

async function assertAdmin(): Promise<AssertAdminResult> {
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
  return { ok: true as const, userId: user.id };
}

export async function POST() {
  const admin = await assertAdmin();
  if (!admin.ok) {
    return apiError(admin.message, admin.status);
  }

  console.log("[admin/payouts] run triggered by", admin.userId);

  try {
    const result = await runCreatorPayouts();
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Payout run failed";
    console.error("[admin/payouts/run]", err);
    return apiError(message, 500);
  }
}
