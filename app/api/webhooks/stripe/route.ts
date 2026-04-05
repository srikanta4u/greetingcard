import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const body = await request.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe] Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId?.trim();
        if (orderId) {
          const { error } = await adminClient
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);
          if (error) {
            console.error("[stripe] orders update failed:", error.message);
          }
        }
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;
        const orderId = session.metadata?.orderId?.trim();
        if (orderId) {
          const { error } = await adminClient
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);
          if (error) {
            console.error(
              "[stripe] orders update (checkout.session) failed:",
              error.message,
            );
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId?.trim();
        if (userId) {
          const { error } = await adminClient
            .from("users")
            .update({ subscription_active: false })
            .eq("id", userId);
          if (error) {
            console.error("[stripe] users subscription_active update failed:", error.message);
          }
        }
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId?.trim();
        if (userId) {
          const { error } = await adminClient
            .from("users")
            .update({
              subscription_active: true,
              subscription_plan: "pro",
            })
            .eq("id", userId);
          if (error) {
            console.error("[stripe] users subscription create update failed:", error.message);
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.error("[stripe] invoice.payment_failed", {
          id: invoice.id,
          customer: invoice.customer,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          billing_reason: invoice.billing_reason,
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
