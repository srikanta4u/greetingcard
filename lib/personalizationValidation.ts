const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_FONTS = new Set(["classic", "modern", "script"]);

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidDesignUuid(id: string): boolean {
  return UUID_RE.test(id.trim());
}

export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();
}

export function validatePersonalizationMessage(message: string):
  | { ok: true; message: string }
  | { ok: false; error: string } {
  const stripped = stripHtmlTags(message);
  if (stripped.length > 1500) {
    return { ok: false, error: "Message must be at most 1500 characters" };
  }
  return { ok: true, message: stripped };
}

export function validateFont(font: string): { ok: true; font: string } | { ok: false; error: string } {
  const f = font.trim().toLowerCase();
  if (!ALLOWED_FONTS.has(f)) {
    return {
      ok: false,
      error: "font must be one of: classic, modern, script",
    };
  }
  return { ok: true, font: f };
}

export function validateHexColor(color: string):
  | { ok: true; color: string }
  | { ok: false; error: string } {
  const c = color.trim();
  if (!HEX_COLOR_RE.test(c)) {
    return {
      ok: false,
      error: "color must be a valid hex color (#xxxxxx)",
    };
  }
  return { ok: true, color: c };
}
