import type { PrintOrder } from "./types";

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function asRecord(p: unknown): Record<string, unknown> {
  if (p && typeof p === "object" && !Array.isArray(p)) {
    return p as Record<string, unknown>;
  }
  return {};
}

type ContactRow = {
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type DesignRow = {
  front_image_url: string;
  back_image_url: string | null;
};

export type OrderFulfillmentRow = {
  id: string;
  personalization: unknown;
  designs:
    | DesignRow
    | DesignRow[]
    | null;
  contacts: ContactRow | ContactRow[] | null;
};

export function buildPrintOrderFromRow(row: OrderFulfillmentRow): {
  order: PrintOrder;
} | { error: string } {
  const design = one(row.designs);
  if (!design?.front_image_url) {
    return { error: "Missing design or front image" };
  }

  const p = asRecord(row.personalization);
  const contact = one(row.contacts);

  const messageText = typeof p.message === "string" ? p.message : "";
  const font = typeof p.font === "string" ? p.font : "modern";
  const color = typeof p.color === "string" ? p.color : "#1a1a1a";

  const base = {
    orderId: row.id,
    frontImageUrl: design.front_image_url,
    backImageUrl: design.back_image_url ?? undefined,
    personalization: p,
    messageText,
    font,
    color,
  };

  if (contact) {
    return {
      order: {
        ...base,
        recipientName: contact.name?.trim() || "Recipient",
        address: {
          line1: contact.address_line1,
          line2: contact.address_line2 ?? undefined,
          city: contact.city,
          state: contact.state,
          postal_code: contact.postal_code,
          country: contact.country,
        },
      },
    };
  }

  const ra = p.recipientAddress;
  if (
    ra &&
    typeof ra === "object" &&
    !Array.isArray(ra) &&
    typeof (ra as Record<string, unknown>).address_line1 === "string"
  ) {
    const a = ra as Record<string, unknown>;
    const guestEmail = p.guestEmail;
    const recipientName =
      typeof guestEmail === "string" && guestEmail.trim()
        ? guestEmail.trim()
        : "Recipient";
    return {
      order: {
        ...base,
        recipientName,
        address: {
          line1: String(a.address_line1),
          line2:
            a.address_line2 === null || a.address_line2 === undefined
              ? undefined
              : String(a.address_line2),
          city: String(a.city),
          state: String(a.state),
          postal_code: String(a.postal_code),
          country: String(a.country),
        },
      },
    };
  }

  return { error: "Missing contact and recipient address" };
}
