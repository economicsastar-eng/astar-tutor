import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createCheckoutSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { Logo } from "@/components/Logo";

const VALID_PLANS = new Set([
  "monthly_subscription",
  "until_2027_onetime",
  "until_2028_onetime",
]);

export const Route = createFileRoute("/checkout/start")({
  head: () => ({ meta: [{ title: "Starting checkout — EconAStar" }] }),
  validateSearch: (search: Record<string, unknown>): { plan?: string } => ({
    plan: typeof search.plan === "string" ? search.plan : undefined,
  }),
  component: CheckoutStart,
});

function CheckoutStart() {
  const { plan } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      if (!plan || !VALID_PLANS.has(plan)) {
        setError("Unknown plan. Please pick a plan from the pricing page.");
        return;
      }

      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        // Not signed in — bounce to signup carrying the plan intent.
        navigate({ to: "/signup", search: { plan } as never, replace: true });
        return;
      }

      try {
        const result = await createCheckoutSession({
          data: {
            priceId: plan,
            returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
            environment: getStripeEnvironment(),
          },
        });
        if ("error" in result) {
          setError(result.error);
          return;
        }
        if (!result.url) {
          setError("Stripe did not return a checkout URL.");
          return;
        }
        window.location.href = result.url;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start checkout.");
      }
    })();
  }, [plan, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1c2e] px-4">
      <div className="max-w-md w-full text-center space-y-5 bg-[#1a2744] border border-white/5 rounded-2xl p-8">
        <Logo variant="light" />
        {error ? (
          <>
            <h1 className="font-display text-xl font-bold text-white">Couldn't start checkout</h1>
            <p className="text-slate-300 text-sm">{error}</p>
            <a
              href="/account"
              className="inline-block text-sm text-emerald hover:underline"
            >
              Go to account
            </a>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold text-white">Taking you to checkout…</h1>
            <p className="text-slate-400 text-sm">Hang tight, Stripe is loading.</p>
            <div className="mx-auto size-8 rounded-full border-2 border-emerald border-t-transparent animate-spin" />
          </>
        )}
      </div>
    </div>
  );
}
