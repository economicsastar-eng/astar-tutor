import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    features: ["Theme 1: Markets & Market Failure (full access)", "3 tutor messages per day", "No essay marking"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Monthly",
    price: "£19.99",
    period: "/month",
    note: "Cancel anytime",
    features: ["Full course: all 4 themes", "Unlimited tutor", "10 essay marks per month"],
    cta: "Start Monthly",
    highlighted: false,
  },
  {
    name: "Until Exams 2027",
    price: "£49.99",
    period: "one-time",
    note: "Access until 31 July 2027",
    badge: "🏆 Most popular",
    features: ["Everything in Monthly", "Unlimited essay marking", "Exam practice section", "Progress saved if you pause"],
    cta: "Get Access Until Exams",
    highlighted: true,
  },
  {
    name: "Until Exams 2028",
    price: "£79.99",
    period: "one-time",
    note: "Access until 31 July 2028 — for Year 12s",
    features: ["Everything in Monthly", "Unlimited essay marking", "Exam practice + Y12→Y13 transition content"],
    cta: "Get 2-Year Access",
    highlighted: false,
  },
];

export function Pricing() {
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                t.highlighted
                  ? "bg-gradient-to-b from-emerald/20 to-navy-surface border-2 border-emerald"
                  : "bg-navy-surface border border-white/10"
              }`}
            >
              {t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
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
                className={`mt-6 w-full font-semibold ${
                  t.highlighted
                    ? "bg-emerald hover:bg-emerald-hover text-white"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {t.cta}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-sm text-slate-soft">
            Full access for less than the cost of a single private tutoring session per month.
          </p>
          <p className="text-sm text-slate-soft">
            🔒 Progress is always saved. If you ever pause your subscription, your progress, predicted grade, and spaced repetition queue are exactly where you left them when you come back.
          </p>
        </div>
      </div>
    </section>
  );
}
