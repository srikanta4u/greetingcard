import { apiError } from "@/lib/apiError";
import { sendEmail } from "@/lib/email/send";
import { designApproved } from "@/lib/email/templates";
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

  const { data: design, error: fetchErr } = await adminClient
    .from("designs")
    .select("title, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !design) {
    return apiError("Design not found", 404);
  }

  const { error } = await adminClient
    .from("designs")
    .update({ status: "active", rejection_reason: null })
    .eq("id", id);

  if (error) {
    console.error("[admin/designs/approve]", error);
    return apiError("Could not update design", 500);
  }

  if (design.creator_id) {
    const { data: creator } = await adminClient
      .from("creators")
      .select("user_id")
      .eq("id", design.creator_id)
      .maybeSingle();
    if (creator?.user_id) {
      const { data: u } = await adminClient
        .from("users")
        .select("email")
        .eq("id", creator.user_id)
        .maybeSingle();
      const emailTo = u?.email?.trim();
      if (emailTo) {
        const creatorName = emailTo.split("@")[0] || "Creator";
        const { subject, html } = designApproved({
          designTitle: design.title,
          creatorName,
        });
        await sendEmail({ to: emailTo, subject, html });
      }
    }
  }

  return NextResponse.json({ success: true });
}
