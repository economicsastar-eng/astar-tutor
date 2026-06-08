const testimonials = [
  {
    quote: "Went from a D to an A in 4 months. The essay feedback is like having a private examiner read every draft.",
    name: "Maya",
    detail: "AQA Economics",
  },
  {
    quote: "Finally something that explains WHY the mark scheme says what it says. Not just 'add more analysis.'",
    name: "James",
    detail: "Edexcel Economics",
  },
  {
    quote: "Used it on the bus every morning for 3 weeks. The tutor at 2am before my mock saved me.",
    name: "Priya",
    detail: "AQA Economics",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-warm-white border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Real students. Real grades.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl bg-card border border-border p-7">
              <div className="text-gold text-2xl leading-none mb-4">★★★★★</div>
              <blockquote className="text-foreground leading-relaxed mb-5">"{t.quote}"</blockquote>
              <figcaption className="text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground">{t.detail}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
