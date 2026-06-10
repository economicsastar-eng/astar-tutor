import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutSessionResult = { url: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

// Plan metadata embedded on the Checkout Session so the webhook can map
// a successful payment to the right plan + expiry without re-looking-up the price.
const PLAN_BY_PRICE: Record<string, { plan: string; expires_at: string | null }> = {
  monthly_subscription: { plan: "monthly", expires_at: null },
  until_2027_onetime: { plan: "until_2027", expires_at: "2027-07-31T23:59:59Z" },
  until_2028_onetime: { plan: "until_2028", expires_at: "2028-07-31T23:59:59Z" },
};

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");

  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;

  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }

  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    priceId: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    if (!PLAN_BY_PRICE[data.priceId]) throw new Error("Unknown plan");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const { userId, supabase } = context;

      // Block duplicate purchases — if they're already on a paid plan that
      // hasn't expired, send them to the billing portal instead.
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("plan,plan_expires_at")
        .eq("id", userId)
        .maybeSingle();
      const currentPlan = existingProfile?.plan ?? "free";
      const expiresAt = existingProfile?.plan_expires_at
        ? new Date(existingProfile.plan_expires_at as string)
        : null;
      const stillActive = !expiresAt || expiresAt > new Date();
      if (currentPlan !== "free" && stillActive) {
        return {
          error: "You already have an active plan. Open Manage Billing from your account page to change or cancel it.",
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email ?? undefined;

      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const planMeta = PLAN_BY_PRICE[data.priceId];

      let productDescription: string | undefined;
      if (!isRecurring) {
        const productId = typeof stripePrice.product === "string"
          ? stripePrice.product
          : stripePrice.product.id;
        const product = await stripe.products.retrieve(productId);
        productDescription = product.name;
      }

      // Hosted Checkout requires success_url / cancel_url, NOT return_url
      // (return_url is for embedded modes). Split returnUrl into both.
      const successUrl = data.returnUrl;
      const cancelUrl = data.returnUrl.split("?")[0].replace(/\/checkout\/return$/, "/account");

      const sessionParams: any = {
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "hosted",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer: customerId,
        managed_payments: { enabled: true },
        metadata: {
          userId,
          plan: planMeta.plan,
          plan_expires_at: planMeta.expires_at ?? "",
          managed_payments: "true",
        },
        ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
        ...(isRecurring && {
          subscription_data: {
            metadata: { userId, plan: planMeta.plan },
          },
        }),
      };
      const session = await stripe.checkout.sessions.create(sessionParams);

      return { url: session.url ?? "" };
    } catch (error) {
      console.error("createCheckoutSession error:", error);
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    try {
      const { supabase, userId } = context;
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();
      if (pErr || !profile?.stripe_customer_id) {
        return { error: "No billing account found. Make a purchase first." };
      }

      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id as string,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      console.error("createPortalSession error:", error);
      return { error: getStripeErrorMessage(error) };
    }
  });
