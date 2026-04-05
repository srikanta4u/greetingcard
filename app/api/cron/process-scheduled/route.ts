import { processScheduledCards } from "@/lib/processScheduledCards";
import { NextResponse } from "next/server";

function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const token = bearerToken(request);
  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { evaluated, dispatched, skipped } = await processScheduledCards();
    return NextResponse.json({ evaluated, dispatched, skipped });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Processing failed";
    console.error("[cron/process-scheduled]", err);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
