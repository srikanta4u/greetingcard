import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

type CheckoutBody = {
  priceId?: string;
  userId?: string;
  orderId?: string;
  billing?: "monthly" | "yearly";
};

function isSubscriptionPrice(priceId: string) {
  const monthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const yearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  return priceId === monthly || priceId === yearly;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.userId && body.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId, billing } = body;
  let priceId = body.priceId;

  if (billing === "monthly" || billing === "yearly") {
    priceId =
      billing === "monthly"
        ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID?.trim()
        : process.env.STRIPE_PRO_YEARLY_PRICE_ID?.trim();
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Stripe Pro price IDs are not configured (STRIPE_PRO_MONTHLY_PRICE_ID / STRIPE_PRO_YEARLY_PRICE_ID)",
        },
        { status: 500 },
      );
    }
  } else if (!priceId || typeof priceId !== "string") {
    return NextResponse.json(
      { error: "priceId or billing is required" },
      { status: 400 },
    );
  }

  const userId = user.id;

  const baseUrl = process.env.NEXT_PUBLIC_URL?.trim();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_URL is not configured" },
      { status: 500 },
    );
  }

  const base = baseUrl.replace(/\/$/, "");

  const mode = isSubscriptionPrice(priceId) ? "subscription" : "payment";

  const metaOrderId = orderId ?? "";
  const metadata = {
    orderId: metaOrderId,
    userId,
  };

  const successUrl =
    mode === "subscription"
      ? `${base}/dashboard?upgraded=true`
      : `${base}/dashboard/orders?success=true`;
  const cancelUrl =
    mode === "subscription" ? `${base}/pricing` : `${base}/marketplace`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: true },
      metadata,
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata,
            },
          }
        : {
            payment_intent_data: {
              metadata,
            },
          }),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session did not return a URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("[stripe] checkout.sessions.create:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
