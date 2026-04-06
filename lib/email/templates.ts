const BRAND = "#7c3aed";
const TEXT = "#18181b";
const MUTED = "#52525b";
const BG = "#ffffff";

function shell(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:${BG};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:20px 24px;background:${BRAND};">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">AutoCard</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:${TEXT};font-size:15px;line-height:1.55;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:${MUTED};">You’re receiving this because you have an AutoCard account or placed an order.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function previewMessage(text: string, max = 120): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const PRICING_URL =
  process.env.NEXT_PUBLIC_URL?.replace(/\/$/, "") ?? "";
const pricingLink = `${PRICING_URL}/pricing`;

export function orderConfirmed(args: {
  designTitle: string;
  message: string;
  recipientName: string;
  amount: number;
  orderId: string;
}): { subject: string; html: string } {
  const shortId = args.orderId.replace(/-/g, "").slice(0, 8);
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT};">Your order is confirmed</h1>
    <p style="margin:0 0 20px;color:${TEXT};">Thanks for your purchase — we’re on it.</p>
    <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Design</td><td style="padding:8px 0;text-align:right;font-weight:600;color:${TEXT};">${escapeHtml(args.designTitle)}</td></tr>
      <tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Recipient</td><td style="padding:8px 0;text-align:right;color:${TEXT};">${escapeHtml(args.recipientName)}</td></tr>
      <tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Message preview</td><td style="padding:8px 0;text-align:right;color:${TEXT};max-width:280px;">${escapeHtml(previewMessage(args.message))}</td></tr>
      <tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Total paid</td><td style="padding:8px 0;text-align:right;font-weight:700;color:${BRAND};">${escapeHtml(formatMoney(args.amount))}</td></tr>
      <tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Order</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:13px;color:${TEXT};">#${escapeHtml(shortId)}</td></tr>
    </table>
    <p style="margin:0;color:${MUTED};font-size:13px;">We’ll email you again when your card ships.</p>
  `;
  return {
    subject: "Your card order is confirmed! 🎉",
    html: shell("Order confirmed", inner),
  };
}

export function cardShipped(args: {
  designTitle: string;
  recipientName: string;
  trackingNumber: string;
  carrier: string;
  orderId: string;
}): { subject: string; html: string } {
  const shortId = args.orderId.replace(/-/g, "").slice(0, 8);
  const track = args.trackingNumber || "—";
  const carrier = args.carrier || "Carrier TBD";
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT};">Your card is on the way</h1>
    <p style="margin:0 0 20px;color:${TEXT};">Great news — <strong style="color:${TEXT};">${escapeHtml(args.designTitle)}</strong> for <strong>${escapeHtml(args.recipientName)}</strong> has shipped.</p>
    <table role="presentation" width="100%" style="background:#fafafa;border-radius:8px;padding:16px;margin-bottom:20px;border:1px solid #e4e4e7;">
      <tr><td style="padding:6px 0;color:${MUTED};font-size:13px;">Carrier</td><td style="padding:6px 0;text-align:right;font-weight:600;color:${TEXT};">${escapeHtml(carrier)}</td></tr>
      <tr><td style="padding:6px 0;color:${MUTED};font-size:13px;">Tracking</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-size:14px;color:${BRAND};font-weight:600;">${escapeHtml(track)}</td></tr>
      <tr><td style="padding:6px 0;color:${MUTED};font-size:13px;">Order</td><td style="padding:6px 0;text-align:right;font-size:13px;color:${TEXT};">#${escapeHtml(shortId)}</td></tr>
    </table>
    <p style="margin:0;color:${MUTED};font-size:14px;">Most domestic orders arrive within <strong style="color:${TEXT};">3–7 business days</strong> after shipping. Use your carrier’s site to track the package.</p>
  `;
  return {
    subject: "Your card is on its way! 📬",
    html: shell("Shipped", inner),
  };
}

export function designApproved(args: {
  designTitle: string;
  creatorName: string;
}): { subject: string; html: string } {
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT};">You’re live on the marketplace</h1>
    <p style="margin:0 0 12px;color:${TEXT};">Hi ${escapeHtml(args.creatorName)},</p>
    <p style="margin:0 0 20px;color:${TEXT};">Your design <strong style="color:${BRAND};">${escapeHtml(args.designTitle)}</strong> has been approved and is now visible to buyers on AutoCard.</p>
    <p style="margin:0;color:${MUTED};font-size:14px;">Share your listing and keep an eye on sales from your creator dashboard.</p>
  `;
  return {
    subject: "Your design has been approved! ✅",
    html: shell("Design approved", inner),
  };
}

export function designRejected(args: {
  designTitle: string;
  creatorName: string;
  reason: string;
}): { subject: string; html: string } {
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT};">Design review update</h1>
    <p style="margin:0 0 12px;color:${TEXT};">Hi ${escapeHtml(args.creatorName)},</p>
    <p style="margin:0 0 16px;color:${TEXT};">We weren’t able to approve <strong>${escapeHtml(args.designTitle)}</strong> this time.</p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin-bottom:20px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;">Reviewer note</p>
      <p style="margin:8px 0 0;font-size:14px;color:${TEXT};white-space:pre-wrap;">${escapeHtml(args.reason)}</p>
    </div>
    <p style="margin:0;color:${TEXT};">You’re welcome to revise and resubmit — we’d love to see an updated version that meets our guidelines.</p>
  `;
  return {
    subject: `Design review update for ${args.designTitle}`,
    html: shell("Design update", inner),
  };
}

export function subscriptionExpiring(args: {
  name: string;
  expiryDate: string;
}): { subject: string; html: string } {
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT};">Subscription ending soon</h1>
    <p style="margin:0 0 12px;color:${TEXT};">Hi ${escapeHtml(args.name)},</p>
    <p style="margin:0 0 20px;color:${TEXT};">Your <strong>AutoCard Pro</strong> subscription is set to end on <strong style="color:${BRAND};">${escapeHtml(args.expiryDate)}</strong>.</p>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">Renew to keep scheduling cards, unlimited contacts, and other Pro benefits.</p>
    <a href="${escapeHtml(pricingLink)}" style="display:inline-block;padding:12px 20px;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;font-size:14px;">View plans &amp; renew</a>
  `;
  return {
    subject: "Your AutoCard Pro subscription expires soon ⚠️",
    html: shell("Subscription", inner),
  };
}

export function cardSkipped(args: {
  designTitle: string;
  recipientName: string;
  eventDate: string;
}): { subject: string; html: string } {
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT};">Scheduled card not sent</h1>
    <p style="margin:0 0 16px;color:${TEXT};">We couldn’t send <strong>${escapeHtml(args.designTitle)}</strong> for <strong>${escapeHtml(args.recipientName)}</strong> (${escapeHtml(args.eventDate)}) because your subscription is inactive.</p>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">Reactivate AutoCard Pro to resume scheduled sends and protect important dates.</p>
    <a href="${escapeHtml(pricingLink)}" style="display:inline-block;padding:12px 20px;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;font-size:14px;">Reactivate on pricing</a>
  `;
  return {
    subject: "We couldn't send your card — subscription inactive",
    html: shell("Card skipped", inner),
  };
}

export function creatorPayoutPaid(args: {
  amount: number;
  periodStart: string;
  periodEnd: string;
  transferId: string;
}): { subject: string; html: string } {
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${TEXT};">Payout sent</h1>
    <p style="margin:0 0 20px;color:${TEXT};">We’ve processed a creator payout for your AutoCard sales.</p>
    <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Amount</td><td style="padding:8px 0;text-align:right;font-weight:700;color:${BRAND};font-size:18px;">${escapeHtml(formatMoney(args.amount))}</td></tr>
      <tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Period</td><td style="padding:8px 0;text-align:right;color:${TEXT};">${escapeHtml(args.periodStart)} → ${escapeHtml(args.periodEnd)}</td></tr>
      <tr><td style="padding:8px 0;color:${MUTED};font-size:13px;">Reference</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px;color:${TEXT};">${escapeHtml(args.transferId)}</td></tr>
    </table>
    <p style="margin:0;color:${MUTED};font-size:13px;">Funds should appear in your connected account per your payout schedule.</p>
  `;
  return {
    subject: `You’ve been paid ${formatMoney(args.amount)} — AutoCard`,
    html: shell("Payout", inner),
  };
}
