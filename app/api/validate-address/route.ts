import { NextResponse } from "next/server";

const COUNTRIES = new Set(["US", "CA", "IN"]);

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

function validatePostal(postal: string, country: string): boolean {
  const p = postal.trim();
  switch (country) {
    case "US":
      return /^\d{5}(-\d{4})?$/.test(p);
    case "CA":
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(p);
    case "IN":
      return /^\d{6}$/.test(p);
    default:
      return false;
  }
}

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
    const m = pc.match(/^(\d{5})(-?(\d{4}))?$/);
    if (m && m[3]) {
      pc = `${m[1]}-${m[3]}`;
    } else if (m) {
      pc = m[1];
    }
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
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { valid: false as const, error: "Invalid JSON body" },
      { status: 400 },
    );
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

  if (!address_line1) {
    return NextResponse.json({
      valid: false as const,
      error: "Address line 1 is required",
    });
  }
  if (!city) {
    return NextResponse.json({
      valid: false as const,
      error: "City is required",
    });
  }
  if (!state) {
    return NextResponse.json({
      valid: false as const,
      error: "State / province is required",
    });
  }
  if (!postal_code) {
    return NextResponse.json({
      valid: false as const,
      error: "Postal code is required",
    });
  }
  if (!COUNTRIES.has(country)) {
    return NextResponse.json({
      valid: false as const,
      error: "Country must be US, CA, or IN",
    });
  }
  if (!validatePostal(postal_code, country)) {
    return NextResponse.json({
      valid: false as const,
      error: "Postal code format is invalid for the selected country",
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
