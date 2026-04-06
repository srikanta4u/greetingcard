import {
  createRouteHandlerClient,
  mergeRouteHandlerCookies,
} from "@/lib/supabase/route-handler";
import { NextResponse, type NextRequest } from "next/server";
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

export async function POST(request: NextRequest) {
  const { supabase, response: cookieResponse } = createRouteHandlerClient(
    request,
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const json = (body: object, status: number) =>
    mergeRouteHandlerCookies(
      cookieResponse,
      NextResponse.json(body, { status }),
    );

  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.userId && body.userId !== user.id) {
    return json({ error: "Forbidden" }, 403);
  }

  const { orderId, billing } = body;
  let priceId = body.priceId;

  if (billing === "monthly" || billing === "yearly") {
    priceId =
      billing === "monthly"
        ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID?.trim()
        : process.env.STRIPE_PRO_YEARLY_PRICE_ID?.trim();
    if (!priceId) {
      return json(
        {
          error:
            "Stripe Pro price IDs are not configured (STRIPE_PRO_MONTHLY_PRICE_ID / STRIPE_PRO_YEARLY_PRICE_ID)",
        },
        500,
      );
    }
  } else if (!priceId || typeof priceId !== "string") {
    return json({ error: "priceId or billing is required" }, 400);
  }

  const userId = user.id;

  const baseUrl = process.env.NEXT_PUBLIC_URL?.trim();
  if (!baseUrl) {
    return json({ error: "NEXT_PUBLIC_URL is not configured" }, 500);
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
      return json({ error: "Checkout session did not return a URL" }, 500);
    }

    return json({ url: session.url }, 200);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("[stripe] checkout.sessions.create:", err);
    return json({ error: message }, 502);
  }
}
