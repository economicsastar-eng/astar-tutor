import { useCallback } from "react";
import { getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";
import { toast } from "sonner";

interface CheckoutOptions {
  priceId: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const openCheckout = useCallback(async (opts: CheckoutOptions) => {
    try {
      const result = await createCheckoutSession({
        data: {
          priceId: opts.priceId,
          returnUrl:
            opts.returnUrl ||
            `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      if (!result.url) {
        toast.error("No checkout URL returned");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not start checkout"
      );
    }
  }, []);

  return { openCheckout };
}
