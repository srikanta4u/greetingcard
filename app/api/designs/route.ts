import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TITLE_MAX = 100;
const BASE_PRICE = 4.0;
const MARKUP_MIN = 0.5;
const MARKUP_MAX = 20;
const MARKUP_STEP = 0.5;

const DEFAULT_ZONES = {
  message_text: true,
  font: true,
  accent_color: true,
} as const;

type DesignsBody = {
  title?: unknown;
  tags_occasion?: unknown;
  tags_tone?: unknown;
  tags_recipient?: unknown;
  front_image_url?: unknown;
  back_image_url?: unknown;
  creator_markup?: unknown;
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creatorError) {
    console.error("[designs POST] creator lookup", creatorError);
    return NextResponse.json(
      { error: "Could not verify creator account" },
      { status: 500 },
    );
  }
  if (!creator) {
    return NextResponse.json(
      { error: "You need a creator profile to upload designs" },
      { status: 403 },
    );
  }

  let body: DesignsBody;
  try {
    body = (await request.json()) as DesignsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const front =
    typeof body.front_image_url === "string"
      ? body.front_image_url.trim()
      : "";
  const backRaw =
    typeof body.back_image_url === "string"
      ? body.back_image_url.trim()
      : "";
  const back_image_url = backRaw === "" ? null : backRaw;

  const tags_occasion = isStringArray(body.tags_occasion)
    ? body.tags_occasion
    : [];
  const tags_tone = isStringArray(body.tags_tone) ? body.tags_tone : [];
  const tags_recipient = isStringArray(body.tags_recipient)
    ? body.tags_recipient
    : [];

  let creator_markup =
    typeof body.creator_markup === "number" && Number.isFinite(body.creator_markup)
      ? body.creator_markup
      : NaN;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (title.length > TITLE_MAX) {
    return NextResponse.json(
      { error: `Title must be at most ${TITLE_MAX} characters` },
      { status: 400 },
    );
  }
  if (!front) {
    return NextResponse.json(
      { error: "Front image is required" },
      { status: 400 },
    );
  }
  if (Number.isNaN(creator_markup)) {
    return NextResponse.json(
      { error: "Invalid creator markup" },
      { status: 400 },
    );
  }
  creator_markup = roundToStep(creator_markup, MARKUP_STEP);
  if (creator_markup < MARKUP_MIN || creator_markup > MARKUP_MAX) {
    return NextResponse.json(
      {
        error: `Markup must be between $${MARKUP_MIN.toFixed(2)} and $${MARKUP_MAX.toFixed(2)}`,
      },
      { status: 400 },
    );
  }

  const { data: design, error: insertError } = await supabase
    .from("designs")
    .insert({
      creator_id: creator.id,
      title,
      tags_occasion,
      tags_tone,
      tags_recipient,
      front_image_url: front,
      back_image_url,
      creator_markup,
      base_price: BASE_PRICE,
      status: "pending",
      customizable_zones: DEFAULT_ZONES,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[designs POST] insert", insertError);
    return NextResponse.json(
      { error: "Could not save design" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: design.id });
}
