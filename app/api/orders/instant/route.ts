import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const TAX_RATE = 0.08;

export type StandardizedAddress = {
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type PersonalizationInput = {
  message?: unknown;
  font?: unknown;
  color?: unknown;
};

type Body = {
  designId?: unknown;
  personalization?: unknown;
  contactId?: unknown;
  recipientAddress?: unknown;
  guestEmail?: unknown;
};

function isStandardizedAddress(v: unknown): v is StandardizedAddress {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.address_line1 === "string" &&
    (o.address_line2 === null || typeof o.address_line2 === "string") &&
    typeof o.city === "string" &&
    typeof o.state === "string" &&
    typeof o.postal_code === "string" &&
    typeof o.country === "string"
  );
}

function isPersonalizationInput(v: unknown): v is PersonalizationInput {
  return v !== null && typeof v === "object";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const designId =
    typeof body.designId === "string" && body.designId.trim()
      ? body.designId.trim()
      : null;
  if (!designId) {
    return NextResponse.json({ error: "designId is required" }, { status: 400 });
  }

  if (!isPersonalizationInput(body.personalization)) {
    return NextResponse.json(
      { error: "personalization object is required" },
      { status: 400 },
    );
  }

  const p = body.personalization;
  const message = typeof p.message === "string" ? p.message : "";
  const font = typeof p.font === "string" ? p.font : "modern";
  const color = typeof p.color === "string" ? p.color : "#1a1a1a";

  const contactId =
    typeof body.contactId === "string" && body.contactId.trim()
      ? body.contactId.trim()
      : null;
  const recipientAddress = body.recipientAddress;
  const guestEmailRaw =
    typeof body.guestEmail === "string" ? body.guestEmail.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (contactId) {
      const { data: contact, error: contactErr } = await adminClient
        .from("contacts")
        .select("id, user_id")
        .eq("id", contactId)
        .maybeSingle();

      if (contactErr || !contact || contact.user_id !== user.id) {
        return NextResponse.json(
          { error: "Invalid contact selection" },
          { status: 400 },
        );
      }
    } else if (!isStandardizedAddress(recipientAddress)) {
      return NextResponse.json(
        { error: "recipientAddress is required when no contact is selected" },
        { status: 400 },
      );
    }
  } else {
    if (!guestEmailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmailRaw)) {
      return NextResponse.json(
        { error: "A valid guestEmail is required" },
        { status: 400 },
      );
    }
    if (!isStandardizedAddress(recipientAddress)) {
      return NextResponse.json(
        { error: "recipientAddress is required" },
        { status: 400 },
      );
    }
  }

  const { data: design, error: designError } = await adminClient
    .from("designs")
    .select("id, title, front_image_url, base_price, creator_markup")
    .eq("id", designId)
    .maybeSingle();

  if (designError || !design) {
    console.error("[orders/instant] design fetch", designError);
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  const cardPrice =
    Number(design.base_price) + Number(design.creator_markup);
  if (!Number.isFinite(cardPrice) || cardPrice <= 0) {
    return NextResponse.json(
      { error: "Design has an invalid price" },
      { status: 400 },
    );
  }

  const tax = Math.round(cardPrice * TAX_RATE * 100) / 100;
  const total = Math.round((cardPrice + tax) * 100) / 100;

  let recipientSnapshot: StandardizedAddress | null = null;
  if (contactId) {
    const { data: fullContact } = await adminClient
      .from("contacts")
      .select(
        "address_line1, address_line2, city, state, postal_code, country",
      )
      .eq("id", contactId)
      .maybeSingle();
    if (fullContact) {
      recipientSnapshot = {
        address_line1: fullContact.address_line1,
        address_line2: fullContact.address_line2 ?? null,
        city: fullContact.city,
        state: fullContact.state,
        postal_code: fullContact.postal_code,
        country: fullContact.country,
      };
    }
  } else if (isStandardizedAddress(recipientAddress)) {
    recipientSnapshot = recipientAddress;
  }

  const personalization = {
    message,
    font,
    color,
    designTitle: design.title,
    frontImageUrl: design.front_image_url,
    recipientAddress: recipientSnapshot,
    ...(user ? {} : { guestEmail: guestEmailRaw }),
  };

  const { data: orderRow, error: insertError } = await adminClient
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      design_id: designId,
      contact_id: contactId,
      order_type: "instant",
      status: "pending_payment",
      personalization,
      amount_charged: total,
    })
    .select("id")
    .single();

  if (insertError || !orderRow) {
    console.error("[orders/instant] insert", insertError);
    return NextResponse.json(
      { error: "Could not create order" },
      { status: 500 },
    );
  }

  const orderId = orderRow.id as string;

  /* TODO: Replace with real Stripe Checkout — stripe.checkout.sessions.create */
  const checkoutUrl = `/order-confirmation?mock=true&orderId=${orderId}`;
  return NextResponse.json({ checkoutUrl });
}
