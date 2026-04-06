import { apiError } from "@/lib/apiError";
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
    return apiError("Unauthorized", 401);
  }

  let body: ApplyBody;
  try {
    body = (await request.json()) as ApplyBody;
  } catch {
    return apiError("Invalid JSON body", 400);
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
    return apiError("Bio is required", 400);
  }
  if (bio.length > BIO_MAX) {
    return apiError(`Bio must be at most ${BIO_MAX} characters`, 400);
  }
  if (!rightsAccepted) {
    return apiError("You must confirm rights to your designs", 400);
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
      return apiError("You have already submitted an application", 409);
    }
    console.error("[creator/apply]", error);
    return apiError("Could not submit application", 500);
  }

  return NextResponse.json({ success: true });
}
