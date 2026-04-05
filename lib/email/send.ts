import { Resend } from "resend";

const FROM = "AutoCard <noreply@autocard.com>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn("[email] RESEND_API_KEY missing; skipping send to", to);
    return;
  }

  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[email] Resend API error:", error, { to, subject });
      return;
    }
    console.log("[email] sent OK:", { to, subject, id: data?.id });
  } catch (err) {
    console.error("[email] send failed:", err, { to, subject });
  }
}
