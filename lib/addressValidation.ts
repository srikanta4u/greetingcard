export const ALLOWED_COUNTRIES = new Set(["US", "CA", "IN"]);

export function isAllowedCountry(country: string): boolean {
  return ALLOWED_COUNTRIES.has(country.trim().toUpperCase());
}

/** US: exactly 5 digits. CA / IN: existing formats. */
export function validatePostalForCountry(
  postal: string,
  country: string,
): boolean {
  const p = postal.trim();
  switch (country) {
    case "US":
      return /^\d{5}$/.test(p);
    case "CA":
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(p);
    case "IN":
      return /^\d{6}$/.test(p);
    default:
      return false;
  }
}

export function isNonEmptyAddressLine1(line: string): boolean {
  return line.trim().length > 0;
}

export function validateContactName(name: string):
  | { ok: true; name: string }
  | { ok: false; error: string } {
  const t = name.trim();
  if (t.length < 1) {
    return { ok: false, error: "Name is required" };
  }
  if (t.length > 100) {
    return { ok: false, error: "Name must be at most 100 characters" };
  }
  return { ok: true, name: t };
}

export function validateStandardizedAddressFields(addr: {
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}): { ok: true } | { ok: false; error: string } {
  if (!isNonEmptyAddressLine1(addr.address_line1)) {
    return { ok: false, error: "Address line 1 is required" };
  }
  const country = addr.country.trim().toUpperCase();
  if (!isAllowedCountry(country)) {
    return { ok: false, error: "Country must be US, CA, or IN" };
  }
  if (!addr.city.trim()) {
    return { ok: false, error: "City is required" };
  }
  if (!addr.state.trim()) {
    return { ok: false, error: "State / province is required" };
  }
  if (!validatePostalForCountry(addr.postal_code, country)) {
    return {
      ok: false,
      error: "Postal code format is invalid for the selected country",
    };
  }
  return { ok: true };
}
