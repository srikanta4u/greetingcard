import { apiError } from "@/lib/apiError";
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

async function assertEventOwnedByUser(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  contactId: string,
  eventId: string,
) {
  const { data: eventRow, error: evError } = await supabase
    .from("contact_events")
    .select("id, contact_id")
    .eq("id", eventId)
    .maybeSingle();

  if (evError) {
    return { ok: false as const, status: 500 as const };
  }
  if (!eventRow || eventRow.contact_id !== contactId) {
    return { ok: false as const, status: 404 as const };
  }

  const { data: contactRow, error: cError } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (cError) {
    return { ok: false as const, status: 500 as const };
  }
  if (!contactRow) {
    return { ok: false as const, status: 404 as const };
  }

  return { ok: true as const };
}

type RouteCtx = { params: Promise<{ id: string; eventId: string }> };

const EVENT_TYPES = new Set([
  "Birthday",
  "Anniversary",
  "Holiday",
  "Sympathy",
  "Thank You",
  "Other",
]);

type PatchBody = {
  event_type?: unknown;
  event_date?: unknown;
  recurs_annually?: unknown;
};

export async function PATCH(request: Request, context: RouteCtx) {
  const { supabase, user } = await getAuthedUser();
  if (!user || !supabase) {
    return apiError("Unauthorized", 401);
  }

  const { id: contactId, eventId } = await context.params;
  const gate = await assertEventOwnedByUser(
    supabase,
    user.id,
    contactId,
    eventId,
  );
  if (!gate.ok) {
    return apiError("Not found", gate.status);
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.event_type === "string") {
    const t = body.event_type.trim();
    if (!EVENT_TYPES.has(t)) {
      return apiError("Invalid event type", 400);
    }
    updates.event_type = t;
  }
  if (typeof body.event_date === "string") {
    const d = body.event_date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return apiError("event_date must be YYYY-MM-DD", 400);
    }
    updates.event_date = d;
  }
  if (typeof body.recurs_annually === "boolean") {
    updates.recurs_annually = body.recurs_annually;
  }

  if (Object.keys(updates).length === 0) {
    return apiError("No updates", 400);
  }

  const { data, error } = await supabase
    .from("contact_events")
    .update(updates)
    .eq("id", eventId)
    .eq("contact_id", contactId)
    .select("id, event_type, event_date, recurs_annually")
    .single();

  if (error) {
    console.error("[contact_events PATCH]", error);
    return apiError("Could not update event", 500);
  }

  return NextResponse.json({ event: data });
}

export async function DELETE(_request: Request, context: RouteCtx) {
  const { supabase, user } = await getAuthedUser();
  if (!user || !supabase) {
    return apiError("Unauthorized", 401);
  }

  const { id: contactId, eventId } = await context.params;
  const gate = await assertEventOwnedByUser(
    supabase,
    user.id,
    contactId,
    eventId,
  );
  if (!gate.ok) {
    return apiError("Not found", gate.status);
  }

  const { error } = await supabase
    .from("contact_events")
    .delete()
    .eq("id", eventId)
    .eq("contact_id", contactId);

  if (error) {
    console.error("[contact_events DELETE]", error);
    return apiError("Could not delete event", 500);
  }

  return NextResponse.json({ success: true });
}
