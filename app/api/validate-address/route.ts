import { apiError } from "@/lib/apiError";
import { validateStandardizedAddressFields } from "@/lib/addressValidation";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/requestIp";
import { NextResponse } from "next/server";

export type StandardizedAddressPayload = {
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type Body = {
  address_line1?: unknown;
  address_line2?: unknown;
  city?: unknown;
  state?: unknown;
  postal_code?: unknown;
  country?: unknown;
};

function formatCaPostal(p: string) {
  const compact = p.replace(/\s+/g, "").toUpperCase();
  if (compact.length === 6) {
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  return p.trim().toUpperCase();
}

function standardize(
  address_line1: string,
  address_line2: string | null,
  city: string,
  state: string,
  postal_code: string,
  country: string,
): StandardizedAddressPayload {
  let pc = postal_code.trim();
  if (country === "CA") {
    pc = formatCaPostal(pc);
  } else if (country === "US") {
    const m = pc.match(/^(\d{5})$/);
    pc = m ? m[1] : pc;
  }

  return {
    address_line1: address_line1.trim(),
    address_line2: address_line2?.trim() ? address_line2.trim() : null,
    city: city.trim(),
    state: state.trim(),
    postal_code: pc,
    country,
  };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (
    !rateLimit({
      key: `${ip}:/api/validate-address`,
      limit: 30,
      windowMs: 60 * 1000,
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

  const address_line1 =
    typeof body.address_line1 === "string" ? body.address_line1.trim() : "";
  const address_line2Raw =
    typeof body.address_line2 === "string" ? body.address_line2.trim() : "";
  const address_line2 = address_line2Raw === "" ? null : address_line2Raw;
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const state = typeof body.state === "string" ? body.state.trim() : "";
  const postal_code =
    typeof body.postal_code === "string" ? body.postal_code.trim() : "";
  const country =
    typeof body.country === "string" ? body.country.trim().toUpperCase() : "";

  const fieldsCheck = validateStandardizedAddressFields({
    address_line1,
    city,
    state,
    postal_code,
    country,
  });
  if (!fieldsCheck.ok) {
    return NextResponse.json({
      valid: false as const,
      error: fieldsCheck.error,
    });
  }

  const standardized = standardize(
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
  );

  if (process.env.NODE_ENV === "development") {
    console.log("[validate-address] OK", standardized);
  }

  return NextResponse.json({
    valid: true as const,
    standardized,
  });
}
