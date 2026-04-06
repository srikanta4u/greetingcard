import { apiError } from "@/lib/apiError";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BIO_MAX = 500;

type ApplyBody = {
  name?: unknown;
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

  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const bio =
    typeof body.bio === "string" ? body.bio.trim() : "";
  const portfolioRaw =
    typeof body.portfolio_url === "string"
      ? body.portfolio_url.trim()
      : "";
  const rightsAccepted = body.rights_accepted === true;

  if (!name) {
    return apiError("Name is required", 400);
  }
  if (name.length > 120) {
    return apiError("Name must be at most 120 characters", 400);
  }
  if (!portfolioRaw) {
    return apiError("Portfolio URL is required", 400);
  }
  let portfolio_url: string;
  try {
    const u = new URL(
      portfolioRaw.includes("://") ? portfolioRaw : `https://${portfolioRaw}`,
    );
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return apiError("Portfolio URL must be http or https", 400);
    }
    portfolio_url = u.toString();
  } catch {
    return apiError("Portfolio URL is not valid", 400);
  }
  if (!bio) {
    return apiError("Bio is required", 400);
  }
  if (bio.length > BIO_MAX) {
    return apiError(`Bio must be at most ${BIO_MAX} characters`, 400);
  }
  if (!rightsAccepted) {
    return apiError("You must confirm rights to your designs", 400);
  }

  const { error: updateNameErr } = await supabase.auth.updateUser({
    data: { full_name: name },
  });
  if (updateNameErr) {
    console.error("[creator/apply] updateUser", updateNameErr);
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
