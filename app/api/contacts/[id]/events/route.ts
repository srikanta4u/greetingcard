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

async function assertContactOwner(
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

export async function GET(_request: Request, context: RouteCtx) {
  const { supabase, user } = await getAuthedUser();
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: contactId } = await context.params;
  const owned = await assertContactOwner(supabase, user.id, contactId);
  if (!owned.ok) {
    return NextResponse.json(
      { error: "Not found" },
      { status: owned.status },
    );
  }

  const { data, error } = await supabase
    .from("contact_events")
    .select("id, event_type, event_date, recurs_annually")
    .eq("contact_id", contactId)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("[contact_events GET]", error);
    return NextResponse.json(
      { error: "Could not load events" },
      { status: 500 },
    );
  }

  return NextResponse.json({ events: data ?? [] });
}

type PostBody = {
  event_type?: unknown;
  event_date?: unknown;
  recurs_annually?: unknown;
};

const EVENT_TYPES = new Set([
  "Birthday",
  "Anniversary",
  "Holiday",
  "Sympathy",
  "Thank You",
  "Other",
]);

export async function POST(request: Request, context: RouteCtx) {
  const { supabase, user } = await getAuthedUser();
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: contactId } = await context.params;
  const owned = await assertContactOwner(supabase, user.id, contactId);
  if (!owned.ok) {
    return NextResponse.json(
      { error: "Not found" },
      { status: owned.status },
    );
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event_type =
    typeof body.event_type === "string" ? body.event_type.trim() : "";
  const event_date =
    typeof body.event_date === "string" ? body.event_date.trim() : "";
  const recurs_annually = body.recurs_annually === true;

  if (!event_type || !EVENT_TYPES.has(event_type)) {
    return NextResponse.json(
      { error: "Invalid event type" },
      { status: 400 },
    );
  }
  if (!event_date || !/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
    return NextResponse.json(
      { error: "event_date must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("contact_events")
    .insert({
      contact_id: contactId,
      event_type,
      event_date,
      recurs_annually,
    })
    .select("id, event_type, event_date, recurs_annually")
    .single();

  if (error) {
    console.error("[contact_events POST]", error);
    return NextResponse.json(
      { error: "Could not create event" },
      { status: 500 },
    );
  }

  return NextResponse.json({ event: data });
}
