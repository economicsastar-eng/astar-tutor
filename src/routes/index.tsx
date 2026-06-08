import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { Parents } from "@/components/landing/Parents";
import { FAQ } from "@/components/landing/FAQ";
import { LandingFooter } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EconAStar — Ace Your A-Level Economics" },
      { name: "description", content: "The only A-Level Economics platform built by a practising tutor and obsessed with your exam grade. AQA, Edexcel, OCR, WJEC." },
      { property: "og:title", content: "EconAStar — Ace Your A-Level Economics" },
      { property: "og:description", content: "A-Level Economics revision built by a practising tutor and obsessed with your exam grade." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <LandingNav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <Parents />
        <FAQ />
      </main>
      <LandingFooter />
    </div>
  );
}
