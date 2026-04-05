import { sendEmail } from "@/lib/email/send";
import { designRejected } from "@/lib/email/templates";
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

type RejectBody = {
  reason?: unknown;
};

export async function POST(request: Request, context: RouteContext) {
  const admin = await assertAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: RejectBody;
  try {
    body = (await request.json()) as RejectBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const reason =
    typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json(
      { error: "reason is required" },
      { status: 400 },
    );
  }

  const { data: design, error: fetchErr } = await adminClient
    .from("designs")
    .select("title, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  const { error } = await adminClient
    .from("designs")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    console.error("[admin/designs/reject]", error);
    return NextResponse.json(
      { error: "Could not update design" },
      { status: 500 },
    );
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
        const { subject, html } = designRejected({
          designTitle: design.title,
          creatorName,
          reason,
        });
        await sendEmail({ to: emailTo, subject, html });
      }
    }
  }

  return NextResponse.json({ success: true });
}
