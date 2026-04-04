import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

type CheckoutBody = {
  priceId: string;
  userId: string;
  orderId?: string;
};

function isSubscriptionPrice(priceId: string) {
  const monthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const yearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  return priceId === monthly || priceId === yearly;
}

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { priceId, userId, orderId } = body;
  if (!priceId || typeof priceId !== "string") {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 });
  }
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_URL is not configured" },
      { status: 500 },
    );
  }

  const mode = isSubscriptionPrice(priceId) ? "subscription" : "payment";

  const metaOrderId = orderId ?? "";
  const metadata = {
    orderId: metaOrderId,
    userId,
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl.replace(/\/$/, "")}/dashboard/orders?success=true`,
      cancel_url: `${baseUrl.replace(/\/$/, "")}/marketplace`,
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
