import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BIO_MAX = 500;

type ApplyBody = {
  bio?: unknown;
  portfolio_url?: unknown;
  rights_accepted?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ApplyBody;
  try {
    body = (await request.json()) as ApplyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bio =
    typeof body.bio === "string" ? body.bio.trim() : "";
  const portfolioRaw =
    typeof body.portfolio_url === "string"
      ? body.portfolio_url.trim()
      : "";
  const portfolio_url = portfolioRaw === "" ? null : portfolioRaw;
  const rightsAccepted = body.rights_accepted === true;

  if (!bio) {
    return NextResponse.json(
      { error: "Bio is required" },
      { status: 400 },
    );
  }
  if (bio.length > BIO_MAX) {
    return NextResponse.json(
      { error: `Bio must be at most ${BIO_MAX} characters` },
      { status: 400 },
    );
  }
  if (!rightsAccepted) {
    return NextResponse.json(
      { error: "You must confirm rights to your designs" },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("creators").insert({
    user_id: user.id,
    bio,
    portfolio_url,
    is_verified: false,
    rights_accepted_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already submitted an application" },
        { status: 409 },
      );
    }
    console.error("[creator/apply]", error);
    return NextResponse.json(
      { error: "Could not submit application" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
