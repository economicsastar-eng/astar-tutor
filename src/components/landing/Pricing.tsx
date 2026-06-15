import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

type Tier = {
  name: string;
  price: string;
  period: string;
  note?: string;
  badge?: string;
  priceId?: string; // omitted = free tier
  features: string[];
  cta: string;
  highlighted: boolean;
};

const tiers: Tier[] = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    features: [
      "Theme 1: Markets & Market Failure (full access)",
      "5 AI tutor messages per day",
      "1 free essay mark",
      "Spaced repetition review",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Monthly",
    price: "£19.99",
    period: "/month",
    note: "Cancel anytime",
    priceId: "monthly_subscription",
    features: [
      "Full access to all 93 lessons",
      "Unlimited AI tutor",
      "10 essay marks per month",
      "Spaced repetition review",
    ],
    cta: "Start Monthly",
    highlighted: false,
  },
  {
    name: "Until May 2027 Exams",
    price: "£49.99",
    period: "one-time",
    note: "Never pay again until after your exams",
    badge: "Most Popular",
    priceId: "until_2027_onetime",
    features: [
      "Everything in Monthly",
      "Unlimited essay marking",
      "Exam practice section",
      "Progress saved if you pause",
    ],
    cta: "Get Access Until Exams",
    highlighted: true,
  },
  {
    name: "Until May 2028 Exams",
    price: "£79.99",
    period: "one-time",
    note: "Best value for Year 12 students",
    priceId: "until_2028_onetime",
    features: [
      "Everything in Until 2027",
      "Two years of full access",
      "Spec updates included",
      "Progress saved if you pause",
    ],
    cta: "Get Access Until 2028",
    highlighted: false,
  },
];

const testimonials = [
  { quote: "Went from a D to a B in my mock after 3 weeks.", attrib: "— Year 13 student" },
  { quote: "The essay marker showed me exactly what I was missing. Got 22/25 next try.", attrib: "— Year 13 student" },
  { quote: "Honestly more useful than my £40/hour tutor. And it's there at 11pm.", attrib: "— Year 12 student" },
];

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes, monthly plans cancel with one click." },
  { q: "Is this just for AQA?", a: "Currently yes — AQA 7136 fully covered. Edexcel coming soon." },
  { q: "What if I already understand a topic?", a: "Use the Test Out button on any lesson to skip it instantly." },
  { q: "How is this different from free resources?", a: "Every lesson is written by a working economics tutor. The AI essay marker gives feedback specific to your answer, not generic tips." },
];

export function Pricing() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);

  const onCtaClick = async (tier: Tier) => {
    setPending(tier.name);
    try {
      // Free tier just sends to signup.
      if (!tier.priceId) {
        navigate({ to: "/signup" });
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        // Carry plan intent through signup → auto-checkout after auth.
        navigate({ to: "/signup", search: { plan: tier.priceId } as never });
        return;
      }
      // Already signed in — jump straight into checkout.
      navigate({ to: "/checkout/start", search: { plan: tier.priceId } as never });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(null);
    }
  };

  return (
    <section id="pricing" className="py-20 md:py-28 bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
            Pick your plan
          </h2>
          <p className="mt-4 text-lg text-slate-soft">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                t.highlighted
                  ? "bg-gradient-to-b from-emerald/20 to-navy-surface border-2 border-emerald lg:scale-105 lg:shadow-xl lg:shadow-emerald/10"
                  : "bg-navy-surface border border-white/10"
              }`}
            >
              {t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-wider">
                  {t.badge}
                </div>
              )}
              <h3 className="font-display text-xl font-bold text-white">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-white">{t.price}</span>
                <span className="text-sm text-slate-soft">{t.period}</span>
              </div>
              {t.note && <p className="text-xs text-slate-soft mt-1">{t.note}</p>}
              <ul className="mt-6 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-white/90">
                    <Check className="h-4 w-4 text-emerald flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => onCtaClick(t)}
                disabled={pending === t.name}
                className={`mt-6 w-full font-semibold h-11 ${
                  t.highlighted
                    ? "bg-emerald hover:bg-emerald-hover text-white"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {pending === t.name ? "Loading…" : t.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-16 grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-xl bg-navy-surface border border-white/10 p-5">
              <p className="text-white/90 italic">"{t.quote}"</p>
              <p className="text-xs text-slate-soft mt-3">{t.attrib}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="font-display text-2xl font-bold text-white text-center mb-8">Frequently asked questions</h3>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className="rounded-xl bg-navy-surface border border-white/10 p-5 group">
                <summary className="font-semibold text-white cursor-pointer flex items-center justify-between list-none">
                  <span>{f.q}</span>
                  <span className="text-emerald transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-slate-soft text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-sm text-slate-soft">
            🔒 Progress is always saved. If you pause, your progress, predicted grade, and spaced repetition queue are exactly where you left them.
          </p>
        </div>
      </div>
    </section>
  );
}
