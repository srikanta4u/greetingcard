import { Resend } from "resend";

const FROM = "AutoCard <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[email] RESEND_API_KEY missing; skipping send to", to);
    return false;
  }

  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      console.error("[email] Resend API error:", error, { to, subject });
      return false;
    }
    console.log("[email] sent OK:", { to, subject, id: data?.id });
    return true;
  } catch (err) {
    console.error("[email] send failed:", err, { to, subject });
    return false;
  }
}
