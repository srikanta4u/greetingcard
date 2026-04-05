import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase: null as null, user: null as null };
  }
  return { supabase, user };
}

async function getOwnedContact(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  contactId: string,
) {
  const { data, error } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return { ok: false as const, status: 500 as const };
  }
  if (!data) {
    return { ok: false as const, status: 404 as const };
  }
  return { ok: true as const };
}

type RouteCtx = { params: Promise<{ id: string }> };

type PatchBody = {
  name?: unknown;
  relationship?: unknown;
  address_line1?: unknown;
  address_line2?: unknown;
  city?: unknown;
  state?: unknown;
  postal_code?: unknown;
  country?: unknown;
};

export async function PATCH(request: Request, context: RouteCtx) {
  const { supabase, user } = await getAuthedUser();
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const owned = await getOwnedContact(supabase, user.id, id);
  if (!owned.ok) {
    return NextResponse.json(
      { error: "Not found" },
      { status: owned.status },
    );
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.relationship === "string") {
    updates.relationship = body.relationship.trim() || null;
  }
  if (typeof body.address_line1 === "string") {
    updates.address_line1 = body.address_line1.trim();
  }
  if (body.address_line2 !== undefined) {
    updates.address_line2 =
      typeof body.address_line2 === "string" && body.address_line2.trim()
        ? body.address_line2.trim()
        : null;
  }
  if (typeof body.city === "string") updates.city = body.city.trim();
  if (typeof body.state === "string") updates.state = body.state.trim();
  if (typeof body.postal_code === "string") {
    updates.postal_code = body.postal_code.trim();
  }
  if (typeof body.country === "string") {
    updates.country = body.country.trim().toUpperCase();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      `
      id,
      name,
      relationship,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      created_at,
      contact_events (
        id,
        event_type,
        event_date,
        recurs_annually
      )
    `,
    )
    .single();

  if (error) {
    console.error("[contacts PATCH]", error);
    return NextResponse.json(
      { error: "Could not update contact" },
      { status: 500 },
    );
  }

  return NextResponse.json({ contact: data });
}

export async function DELETE(_request: Request, context: RouteCtx) {
  const { supabase, user } = await getAuthedUser();
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const owned = await getOwnedContact(supabase, user.id, id);
  if (!owned.ok) {
    return NextResponse.json(
      { error: "Not found" },
      { status: owned.status },
    );
  }

  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[contacts DELETE]", error);
    return NextResponse.json(
      { error: "Could not delete contact" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
