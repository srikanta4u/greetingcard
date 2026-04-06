import { apiError } from "@/lib/apiError";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
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

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const admin = await assertAdmin();
  if (!admin.ok) {
    return apiError(admin.message, admin.status);
  }

  const { userId } = await context.params;
  if (!userId) {
    return apiError("Missing user id", 400);
  }

  const { data: creator } = await adminClient
    .from("creators")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (creator?.id) {
    const { error: cErr } = await adminClient
      .from("creators")
      .update({ is_verified: true })
      .eq("id", creator.id);
    if (cErr) {
      console.error("[admin/creators/approve] creators", cErr);
      return apiError("Could not update creator profile", 500);
    }
  }

  const { error: uErr } = await adminClient
    .from("users")
    .update({ role: "creator" })
    .eq("id", userId);
  if (uErr) {
    console.error("[admin/creators/approve] users", uErr);
    return apiError("Could not update user role", 500);
  }

  return NextResponse.json({ success: true });
}
