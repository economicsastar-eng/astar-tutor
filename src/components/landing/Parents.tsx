export function Parents() {
  return (
    <section className="py-20 md:py-28 bg-warm-white border-y border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-card border border-border p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-sm font-semibold text-emerald uppercase tracking-wider mb-3">For Parents</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                What you're getting
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Most A-Level Economics students pay for private tutors at £50–80/hour. EconAStar gives your child access to an AI tutor, structured course content, and essay marking — for less than the cost of a single tutoring session per month.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                "Full course mapped to their specific exam board",
                "Progress dashboard you can check anytime by asking your child to share their stats",
                "AI marking that gives the kind of specific, actionable feedback only an experienced tutor provides",
              ].map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald text-sm font-bold">✓</span>
                  <span className="text-foreground leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
