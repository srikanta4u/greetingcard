import { sendEmail } from "@/lib/email/send";
import { NextResponse } from "next/server";

const CONTACT_TO = "srikanta.sahoo@gmail.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";

  if (name.length < 1 || name.length > 200) {
    return NextResponse.json(
      { error: "Please enter your name (max 200 characters)." },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (message.length < 10 || message.length > 10000) {
    return NextResponse.json(
      {
        error:
          "Please enter a message of at least 10 characters (max 10,000).",
      },
      { status: 400 },
    );
  }

  const html = `
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  const ok = await sendEmail({
    to: CONTACT_TO,
    subject: `[AutoCard contact] ${name}`,
    html,
    replyTo: email,
  });

  if (!ok) {
    return NextResponse.json(
      {
        error:
          "We could not send your message right now. Please try again later.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
