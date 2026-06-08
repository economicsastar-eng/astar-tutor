import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-soft opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald animate-pulse-soft" />
            Built by a practising A-Level Economics tutor
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground">
            Get Your <span className="text-gold">A*</span> in Economics.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            The only A-Level Economics platform built by a practising tutor, powered by AI, and priced so every student can afford it.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-emerald hover:bg-emerald-hover text-white font-semibold px-8 h-12 text-base">
              Start Free — No Card Required
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold">
              See How It Works
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            AQA · Edexcel · OCR · WJEC — Tutor-built content, not AI slop
          </p>
        </div>
      </div>
    </section>
  );
}
