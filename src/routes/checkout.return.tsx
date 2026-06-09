import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({ meta: [{ title: "Payment complete — EconAStar" }] }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const [plan, setPlan] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  // Poll the profile for up to ~15s so the webhook has time to land.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", u.user.id).maybeSingle();
      if (cancelled) return;
      if (data?.plan && data.plan !== "free") {
        setPlan(data.plan as string);
      } else if (tries < 8) {
        setTimeout(() => setTries((t) => t + 1), 2000);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [tries]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1c2e] px-4">
      <div className="max-w-md text-center space-y-6 bg-[#1a2744] border border-white/5 rounded-2xl p-8">
        <CheckCircle2 className="size-14 text-emerald mx-auto" />
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-white">Payment received</h1>
          <p className="text-slate-300 text-sm">
            {plan
              ? `Your ${plan === "monthly" ? "Monthly" : plan === "until_2027" ? "Until Exams 2027" : "Until Exams 2028"} access is now active.`
              : "We're activating your account — this usually takes a few seconds."}
          </p>
          {session_id && <p className="text-xs text-slate-500 break-all">Ref: {session_id}</p>}
        </div>
        <div className="flex gap-2 justify-center">
          <Button asChild className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/account">View account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
