import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const OCCASIONS = new Set([
  "Birthday",
  "Anniversary",
  "Thank You",
  "Sympathy",
  "Holiday",
  "Congratulations",
  "Other",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const occasion = searchParams.get("occasion");

  const supabase = await createClient();

  let query = supabase
    .from("designs")
    .select(
      "id, title, front_image_url, base_price, creator_markup, tags_occasion",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (occasion && OCCASIONS.has(occasion)) {
    query = query.contains("tags_occasion", [occasion]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[designs/active]", error);
    return NextResponse.json({ error: "Could not load designs" }, {
      status: 500,
    });
  }

  return NextResponse.json({ designs: data ?? [] });
}
