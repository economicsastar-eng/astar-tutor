import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

// One-time purchases: checkout.session.completed (mode = "payment").
// Metadata { userId, plan, plan_expires_at } was set when the session was created.
async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("checkout.session.completed missing userId metadata");
    return;
  }
  if (session.payment_status !== "paid") {
    // For subscriptions we wait for customer.subscription.* events instead.
    return;
  }
  if (session.mode !== "payment") return; // subscriptions handled separately

  const plan = session.metadata?.plan;
  const planExpiresAt = session.metadata?.plan_expires_at || null;
  if (!plan) {
    console.error("checkout.session.completed missing plan metadata");
    return;
  }

  await getSupabase()
    .from("profiles")
    .update({
      plan,
      plan_expires_at: planExpiresAt,
      stripe_customer_id: session.customer,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

async function handleSubscriptionUpsert(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("subscription event missing userId metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  const status = subscription.status as string;
  // Active-ish statuses keep the user on monthly.
  const activeLike = ["active", "trialing", "past_due"].includes(status);

  if (activeLike) {
    await getSupabase()
      .from("profiles")
      .update({
        plan: "monthly",
        plan_expires_at: isoFromUnix(periodEnd),
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  } else {
    // canceled / unpaid / incomplete_expired / paused → downgrade.
    await downgradeToFree(userId, subscription.id);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  await downgradeToFree(userId, subscription.id);
}

async function handleInvoicePaymentFailed(invoice: any) {
  // Per product spec: payment failure on the monthly subscription downgrades immediately.
  const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
  const customerId = invoice.customer;
  if (!subscriptionId || !customerId) return;

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!profile) return;
  await downgradeToFree(profile.id as string, subscriptionId);
}

async function downgradeToFree(userId: string, subscriptionId?: string) {
  const supabase = getSupabase();
  // Only clear the subscription id if it matches the one being deleted/failed,
  // so a stale event doesn't wipe an unrelated newer subscription.
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();

  const clearSubId = !subscriptionId || profile?.stripe_subscription_id === subscriptionId;

  await supabase
    .from("profiles")
    .update({
      plan: "free",
      plan_expires_at: null,
      ...(clearSubId && { stripe_subscription_id: null }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid or missing env query parameter:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
