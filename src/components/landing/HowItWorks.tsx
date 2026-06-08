import { BookOpen, Brain, Trophy } from "lucide-react";

const steps = [
  {
    icon: BookOpen,
    title: "Learn",
    description: "Bite-sized lessons with questions built in. No sitting through slow videos.",
  },
  {
    icon: Brain,
    title: "Review",
    description: "Adaptive algorithm finds what you're forgetting and drills it at the right time.",
  },
  {
    icon: Trophy,
    title: "Nail Your Exam",
    description: "Essay marking that actually reads your answer. Exam technique built in.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">How it works</h2>
          <p className="mt-4 text-lg text-muted-foreground">Three simple steps from where you are to where you want to be.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-border bg-card p-8">
              <div className="absolute -top-4 left-8 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald text-white text-sm font-bold font-display">
                {i + 1}
              </div>
              <step.icon className="h-8 w-8 text-emerald mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
