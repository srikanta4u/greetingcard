import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const FREE_CONTACT_LIMIT = 3;

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

export async function GET() {
  const { supabase, user } = await getAuthedUser();
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("contacts")
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
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[contacts GET]", error);
    return NextResponse.json(
      { error: "Could not load contacts" },
      { status: 500 },
    );
  }

  return NextResponse.json({ contacts: data ?? [] });
}

type PostBody = {
  name?: unknown;
  relationship?: unknown;
  address_line1?: unknown;
  address_line2?: unknown;
  city?: unknown;
  state?: unknown;
  postal_code?: unknown;
  country?: unknown;
};

export async function POST(request: Request) {
  const { supabase, user } = await getAuthedUser();
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_active")
    .eq("id", user.id)
    .maybeSingle();

  const subscriptionActive = Boolean(profile?.subscription_active);

  if (!subscriptionActive) {
    const { count, error: countError } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (countError) {
      console.error("[contacts POST count]", countError);
      return NextResponse.json(
        { error: "Could not verify contact limit" },
        { status: 500 },
      );
    }
    if ((count ?? 0) >= FREE_CONTACT_LIMIT) {
      return NextResponse.json(
        { error: "Upgrade to Pro to add unlimited contacts" },
        { status: 403 },
      );
    }
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const relationship =
    typeof body.relationship === "string" ? body.relationship.trim() : "";
  const address_line1 =
    typeof body.address_line1 === "string" ? body.address_line1.trim() : "";
  const address_line2 =
    typeof body.address_line2 === "string" && body.address_line2.trim()
      ? body.address_line2.trim()
      : null;
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const postal_code =
    typeof body.postal_code === "string" ? body.postal_code.trim() : "";
  const country =
    typeof body.country === "string" ? body.country.trim().toUpperCase() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!address_line1 || !city || !state || !postal_code || !country) {
    return NextResponse.json(
      { error: "Complete address is required" },
      { status: 400 },
    );
  }

  const { data: row, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      name,
      relationship: relationship || null,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
    })
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
    console.error("[contacts POST]", error);
    return NextResponse.json(
      { error: "Could not create contact" },
      { status: 500 },
    );
  }

  return NextResponse.json({ contact: row });
}
