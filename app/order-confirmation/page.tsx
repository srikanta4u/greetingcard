import { stripe } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

type Personalization = {
  message?: string;
  font?: string;
  color?: string;
  designTitle?: string;
  frontImageUrl?: string;
  guestEmail?: string;
};

function formatMoneyCents(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sessionId =
    typeof raw.session_id === "string" ? raw.session_id.trim() : "";
  if (!sessionId) {
    notFound();
  }

  let session: Awaited<
    ReturnType<typeof stripe.checkout.sessions.retrieve>
  > | null = null;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
  } catch {
    notFound();
  }

  const paid = session.payment_status === "paid";
  const orderId =
    typeof session.metadata?.orderId === "string"
      ? session.metadata.orderId.trim()
      : "";

  let personalization: Personalization | null = null;
  if (orderId) {
    const { data: order } = await adminClient
      .from("orders")
      .select("personalization")
      .eq("id", orderId)
      .maybeSingle();
    const p = order?.personalization;
    if (p && typeof p === "object" && !Array.isArray(p)) {
      personalization = p as Personalization;
    }
  }

  const title =
    personalization?.designTitle ??
    session.line_items?.data[0]?.description ??
    "Your card";

  const messagePreview = personalization?.message
    ? personalization.message.slice(0, 160) +
      (personalization.message.length > 160 ? "…" : "")
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm dark:border-emerald-900/40 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              aria-hidden
            >
              <svg
                className="size-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {paid ? "Order placed!" : "Thank you"}
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {paid
                  ? "Your payment was received. We’ll get your card on its way."
                  : "We’re confirming your payment."}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Order summary
            </h2>
            <div className="flex gap-4">
              {personalization?.frontImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={personalization.frontImageUrl}
                  alt=""
                  className="h-24 w-[4.5rem] shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                />
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{title}</p>
                {messagePreview ? (
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {messagePreview}
                  </p>
                ) : null}
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  Total paid {formatMoneyCents(session.amount_total)}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/marketplace"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
          >
            Back to marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
