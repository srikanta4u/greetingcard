import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  calculateSendDate,
  countryForScheduling,
  getNextOccurrence,
} from "@/lib/scheduling";
import { NextResponse } from "next/server";

type PersonalizationInput = {
  message?: unknown;
  font?: unknown;
  color?: unknown;
};

type Body = {
  designId?: unknown;
  contactId?: unknown;
  contactEventId?: unknown;
  personalization?: unknown;
};

function isPersonalization(v: unknown): v is PersonalizationInput {
  return v !== null && typeof v === "object";
}

function parseEventDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return new Date(iso);
  return new Date(y, m - 1, d);
}

function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.subscription_active) {
    return NextResponse.json(
      { error: "Pro subscription required to schedule cards" },
      { status: 403 },
    );
  }

  const designId =
    typeof body.designId === "string" && body.designId.trim()
      ? body.designId.trim()
      : null;
  const contactId =
    typeof body.contactId === "string" && body.contactId.trim()
      ? body.contactId.trim()
      : null;
  const contactEventId =
    typeof body.contactEventId === "string" && body.contactEventId.trim()
      ? body.contactEventId.trim()
      : null;

  if (!designId || !contactId || !contactEventId) {
    return NextResponse.json(
      { error: "designId, contactId, and contactEventId are required" },
      { status: 400 },
    );
  }

  if (!isPersonalization(body.personalization)) {
    return NextResponse.json(
      { error: "personalization object is required" },
      { status: 400 },
    );
  }

  const p = body.personalization;
  const message = typeof p.message === "string" ? p.message : "";
  const font = typeof p.font === "string" ? p.font : "modern";
  const color = typeof p.color === "string" ? p.color : "#1a1a1a";

  const { data: contact, error: contactErr } = await adminClient
    .from("contacts")
    .select("id, user_id, country")
    .eq("id", contactId)
    .maybeSingle();

  if (contactErr || !contact || contact.user_id !== user.id) {
    return NextResponse.json({ error: "Invalid contact" }, { status: 400 });
  }

  const { data: ev, error: evErr } = await adminClient
    .from("contact_events")
    .select("id, contact_id, event_date, event_type, recurs_annually")
    .eq("id", contactEventId)
    .maybeSingle();

  if (evErr || !ev || ev.contact_id !== contactId) {
    return NextResponse.json({ error: "Invalid event for this contact" }, {
      status: 400,
    });
  }

  const eventDay = parseEventDate(ev.event_date);
  let deliveryDate: Date;
  if (Boolean(ev.recurs_annually)) {
    deliveryDate = getNextOccurrence(eventDay);
  } else {
    deliveryDate = new Date(
      eventDay.getFullYear(),
      eventDay.getMonth(),
      eventDay.getDate(),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deliveryDate < today) {
      return NextResponse.json(
        { error: "This event date has already passed" },
        { status: 400 },
      );
    }
  }

  const scheduleCountry = countryForScheduling(contact.country);
  const scheduledSendDate = calculateSendDate(deliveryDate, scheduleCountry);
  const scheduledSendDateStr = formatDateOnly(scheduledSendDate);

  const { data: design, error: designErr } = await adminClient
    .from("designs")
    .select("id, title, front_image_url")
    .eq("id", designId)
    .eq("status", "active")
    .maybeSingle();

  if (designErr || !design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  const personalization = {
    message,
    font,
    color,
    contactEventId,
    eventDeliveryDate: formatDateOnly(deliveryDate),
    eventType: ev.event_type,
    designTitle: design.title,
    frontImageUrl: design.front_image_url,
  };

  const { data: orderRow, error: insertError } = await adminClient
    .from("orders")
    .insert({
      user_id: user.id,
      design_id: designId,
      contact_id: contactId,
      order_type: "scheduled",
      status: "scheduled",
      scheduled_send_date: scheduledSendDateStr,
      personalization,
      amount_charged: 0,
    })
    .select("id")
    .single();

  if (insertError || !orderRow) {
    console.error("[orders/scheduled] insert", insertError);
    return NextResponse.json(
      { error: "Could not create scheduled order" },
      { status: 500 },
    );
  }

  const orderId = orderRow.id as string;

  return NextResponse.json({
    orderId,
    scheduledSendDate: scheduledSendDateStr,
  });
}
