import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/Nav";
import { LandingFooter } from "@/components/landing/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — EconAStar" },
      { name: "description", content: "Terms and conditions for using the EconAStar platform." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: June 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">1. Who we are</h2>
            <p className="text-muted-foreground leading-relaxed">EconAStar ("we", "us", "our") is an A-Level Economics revision platform operated as a sole trader business in England and Wales. By creating an account or using our platform, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">2. The service</h2>
            <p className="text-muted-foreground leading-relaxed">EconAStar provides A-Level Economics revision content, AI-powered essay marking, an AI tutor, and adaptive review tools. We offer a free tier and paid subscription plans. Content is designed to support AQA A-Level Economics (specification 7136) and is verified by a practising economics tutor.</p>
            <p className="text-muted-foreground leading-relaxed mt-3"><strong className="text-foreground">AI content disclaimer:</strong> Our AI tutor and essay marker are powered by Anthropic's Claude AI. While we have designed these tools to be accurate and helpful, AI can make mistakes. Always verify important information with your teacher or the official AQA specification. EconAStar is not responsible for errors in AI-generated content.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">3. Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">You must provide accurate information when creating an account. You are responsible for keeping your password secure. You must not share your account with others — each subscription is for one user. We reserve the right to suspend accounts that we reasonably believe are being shared or misused.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">4. Subscriptions and payments</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Free tier:</strong> access to Theme 1 content and limited AI features, indefinitely and at no cost.</li>
              <li><strong className="text-foreground">Monthly subscription:</strong> billed monthly. You can cancel at any time. Cancellation takes effect at the end of the current billing period — you will not receive a partial refund for unused days.</li>
              <li><strong className="text-foreground">One-time "Until Exams" plans:</strong> a single payment granting access until the specified exam date. No recurring charges.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">All payments are processed by Stripe. Prices are in GBP and include VAT where applicable. We reserve the right to change prices with 30 days' notice to existing subscribers.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">5. Refund policy</h2>
            <p className="text-muted-foreground leading-relaxed">We offer a <strong className="text-foreground">7-day refund</strong> on monthly subscriptions if you are not satisfied. Contact us at <a href="mailto:economicsastar@gmail.com" className="text-emerald underline">economicsastar@gmail.com</a> within 7 days of your first payment. One-time "Until Exams" plans are non-refundable after 7 days given the nature of the access period.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">6. Acceptable use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Share, resell, or redistribute any content from the platform.</li>
              <li>Copy, scrape, or reproduce lesson content, questions, or model answers for commercial purposes.</li>
              <li>Attempt to reverse-engineer, hack, or disrupt the platform.</li>
              <li>Use the AI tutor or essay marker to generate content for submission as your own academic work in a way that violates your school's academic integrity policy.</li>
              <li>Submit harmful, offensive, or illegal content through the essay marker or AI tutor.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">7. Intellectual property</h2>
            <p className="text-muted-foreground leading-relaxed">All lesson content, questions, model answers, diagrams, and platform design are the intellectual property of EconAStar. You may not reproduce, share, or commercialise this content without written permission. EconAStar is not affiliated with AQA, Edexcel, OCR, or any other exam board. Specification references are used for educational purposes only.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">8. Limitation of liability</h2>
            <p className="text-muted-foreground leading-relaxed">EconAStar provides revision support materials. We do not guarantee any specific exam result or grade improvement. To the fullest extent permitted by law, EconAStar is not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including reliance on AI-generated content. Our total liability to you shall not exceed the amount you paid us in the 12 months preceding any claim.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">9. Changes to the service</h2>
            <p className="text-muted-foreground leading-relaxed">We may update, modify, or discontinue features of the platform at any time. We will give reasonable notice of significant changes. If we discontinue the platform entirely, we will provide at least 30 days' notice and a pro-rata refund for any remaining paid subscription period.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">10. Governing law</h2>
            <p className="text-muted-foreground leading-relaxed">These terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">Questions about these terms? Email <a href="mailto:economicsastar@gmail.com" className="text-emerald underline">economicsastar@gmail.com</a>.</p>
          </section>

        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
