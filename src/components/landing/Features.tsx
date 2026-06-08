import { BookOpen, ClipboardCheck, FileText, RefreshCcw, MessageCircle, TrendingUp } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Complete Course", body: "Every AQA topic, in order, nothing missing. Your one-stop revision shop." },
  { icon: ClipboardCheck, title: "Learn by Doing", body: "Questions embedded in every lesson. You're tested as you read, not just at the end." },
  { icon: FileText, title: "AI Essay Marker", body: "Paste your essay. Get feedback in 30 seconds that quotes your exact words, not generic advice." },
  { icon: RefreshCcw, title: "Adaptive Review", body: "Spaced repetition resurfaces exactly what you're forgetting, at the perfect moment." },
  { icon: MessageCircle, title: "AI Tutor", body: "Ask any economics question, any time. Explains mark schemes in plain English, not examiner jargon." },
  { icon: TrendingUp, title: "Predicted Grade", body: "See your predicted grade update in real time as you progress through the course." },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Everything you need to ace it</h2>
          <p className="mt-4 text-lg text-muted-foreground">Built specifically for A-Level Economics. Nothing generic, nothing wasted.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 hover:border-emerald/40 transition-colors">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald/10 text-emerald mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
