import { sendEmail } from "@/lib/email/send";
import { orderConfirmed } from "@/lib/email/templates";
import { apiError } from "@/lib/apiError";
import { validateStandardizedAddressFields } from "@/lib/addressValidation";
import {
  isValidDesignUuid,
  validateFont,
  validateHexColor,
  validatePersonalizationMessage,
} from "@/lib/personalizationValidation";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/requestIp";
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
  try {
    const ip = getClientIp(request);
    const rateKey = `${ip}:/api/orders/instant`;
    if (
      !rateLimit({
        key: rateKey,
        limit: 10,
        windowMs: 60 * 60 * 1000,
      })
    ) {
      return apiError("Too many requests", 429);
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const designIdRaw =
      typeof body.designId === "string" ? body.designId.trim() : "";
    if (!designIdRaw) {
      return apiError("designId is required", 400);
    }
    if (!isValidDesignUuid(designIdRaw)) {
      return apiError("designId must be a valid UUID", 400);
    }
    const designId = designIdRaw;

    if (!isPersonalizationInput(body.personalization)) {
      return apiError("personalization object is required", 400);
    }

    const p = body.personalization;
    const messageRaw = typeof p.message === "string" ? p.message : "";
    const msgCheck = validatePersonalizationMessage(messageRaw);
    if (!msgCheck.ok) {
      return apiError(msgCheck.error, 400);
    }
    const message = msgCheck.message;

    const fontRaw = typeof p.font === "string" ? p.font : "modern";
    const fontCheck = validateFont(fontRaw);
    if (!fontCheck.ok) {
      return apiError(fontCheck.error, 400);
    }
    const font = fontCheck.font;

    const colorRaw = typeof p.color === "string" ? p.color : "#1a1a1a";
    const colorCheck = validateHexColor(colorRaw);
    if (!colorCheck.ok) {
      return apiError(colorCheck.error, 400);
    }
    const color = colorCheck.color;

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
          return apiError("Invalid contact selection", 400);
        }
      } else if (!isStandardizedAddress(recipientAddress)) {
        return apiError(
          "recipientAddress is required when no contact is selected",
          400,
        );
      } else {
        const addrCheck = validateStandardizedAddressFields(recipientAddress);
        if (!addrCheck.ok) {
          return apiError(addrCheck.error, 400);
        }
      }
    } else {
      if (!guestEmailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmailRaw)) {
        return apiError("A valid guestEmail is required", 400);
      }
      if (!isStandardizedAddress(recipientAddress)) {
        return apiError("recipientAddress is required", 400);
      }
      const addrCheck = validateStandardizedAddressFields(recipientAddress);
      if (!addrCheck.ok) {
        return apiError(addrCheck.error, 400);
      }
    }

    const { data: design, error: designError } = await adminClient
      .from("designs")
      .select("id, title, front_image_url, base_price, creator_markup")
      .eq("id", designId)
      .eq("status", "active")
      .maybeSingle();

    if (designError || !design) {
      console.error("[orders/instant] design fetch", designError);
      return apiError("Design not found", 404);
    }

    const cardPrice =
      Number(design.base_price) + Number(design.creator_markup);
    if (!Number.isFinite(cardPrice) || cardPrice <= 0) {
      return apiError("Design has an invalid price", 400);
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
      return apiError("Could not create order", 500);
    }

    const orderId = orderRow.id as string;

    let recipientName = "Recipient";
    if (contactId) {
      const { data: cn } = await adminClient
        .from("contacts")
        .select("name")
        .eq("id", contactId)
        .maybeSingle();
      if (cn?.name?.trim()) {
        recipientName = cn.name.trim();
      }
    }

    const buyerEmail = user?.email?.trim() || guestEmailRaw;
    if (buyerEmail) {
      const { subject, html } = orderConfirmed({
        designTitle: design.title,
        message,
        recipientName,
        amount: total,
        orderId,
      });
      await sendEmail({ to: buyerEmail, subject, html });
    }

    /* TODO: Replace with real Stripe Checkout — stripe.checkout.sessions.create */
    const checkoutUrl = `/order-confirmation?mock=true&orderId=${orderId}`;
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[orders/instant] unexpected error", err);
    return apiError("Something went wrong", 500);
  }
}
