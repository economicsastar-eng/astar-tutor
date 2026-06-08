const advantages = [
  {
    headline: "70% Cheaper",
    body: "Full access from £19.99/month vs UpLearn's £74.99/month. Same quality, fraction of the cost.",
    accent: "gold" as const,
  },
  {
    headline: "Better AI Marking",
    body: "UpLearn's AI marking can't handle graph questions and gives generic feedback. Ours reads your actual answer and quotes it back to you.",
    accent: "emerald" as const,
  },
  {
    headline: "Learn at Your Pace",
    body: "Skip topics you already know with our Test Out feature. UpLearn forces you through everything even at double speed.",
    accent: "emerald" as const,
  },
];

export function WhyUs() {
  return (
    <section className="py-20 md:py-28 bg-warm-white border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Why EconAStar beats UpLearn
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Same concept. Better execution. A fraction of the price.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {advantages.map((a) => (
            <div key={a.headline} className="rounded-2xl bg-card border border-border p-8 hover:shadow-lg transition-shadow">
              <div className={`inline-block h-1.5 w-12 rounded-full mb-5 ${a.accent === "gold" ? "bg-gold" : "bg-emerald"}`} />
              <h3 className="font-display text-2xl font-bold mb-3">{a.headline}</h3>
              <p className="text-muted-foreground leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
