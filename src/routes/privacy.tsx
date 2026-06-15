import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/Nav";
import { LandingFooter } from "@/components/landing/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — EconAStar" },
      { name: "description", content: "How EconAStar collects, uses, and protects your personal data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: June 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Who we are</h2>
            <p className="text-muted-foreground leading-relaxed">EconAStar is an A-Level Economics revision platform operated as a sole trader business in England and Wales. Our contact email is <a href="mailto:economicsastar@gmail.com" className="text-emerald underline">economicsastar@gmail.com</a>. We are registered with the Information Commissioner's Office (ICO) as a data controller.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">What data we collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">When you use EconAStar, we collect the following personal data:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account information:</strong> your name and email address when you sign up.</li>
              <li><strong className="text-foreground">Learning data:</strong> your quiz answers, scores, lesson progress, predicted grade, and spaced repetition queue.</li>
              <li><strong className="text-foreground">Essay submissions:</strong> the essay text you paste into the essay marking tool and the AI feedback generated for it.</li>
              <li><strong className="text-foreground">AI tutor conversations:</strong> messages you send to the AI tutor and the responses you receive.</li>
              <li><strong className="text-foreground">Payment information:</strong> your payment is processed by Stripe. We do not store your card details. We receive confirmation that payment was made and which plan you purchased.</li>
              <li><strong className="text-foreground">Usage data:</strong> pages you visit, features you use, and session duration, collected via standard web analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Why we collect it</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">To provide the service:</strong> your learning data powers your predicted grade, spaced repetition, and personalised review queue.</li>
              <li><strong className="text-foreground">To process your subscription:</strong> we need your email and payment confirmation to manage your account.</li>
              <li><strong className="text-foreground">To improve the platform:</strong> aggregated, anonymised usage data helps us identify which lessons need improving.</li>
              <li><strong className="text-foreground">To contact you:</strong> we may email you about your account, subscription, or relevant platform updates. You can opt out at any time.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">Our legal basis for processing is <strong className="text-foreground">contract performance</strong> (providing the service you signed up for) and <strong className="text-foreground">legitimate interests</strong> (improving the platform). We do not process your data for advertising.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Who we share it with</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We only share your data with the following third-party processors, all of whom are contractually bound to protect it:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Supabase</strong> — our database and authentication provider. Stores your account data and learning progress.</li>
              <li><strong className="text-foreground">Stripe</strong> — our payment processor. Handles all payment card data. See stripe.com/gb/privacy.</li>
              <li><strong className="text-foreground">Anthropic</strong> — the AI provider that powers our AI tutor and essay marking. Your essay text and tutor messages are sent to Anthropic's API to generate responses. See anthropic.com/privacy.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">We do not sell your data. We do not share it with advertisers. We do not share it with your school or college.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">How long we keep it</h2>
            <p className="text-muted-foreground leading-relaxed">We keep your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or financial reasons (for example, Stripe payment records are retained for 7 years as required by UK financial regulations).</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Your rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Access</strong> the personal data we hold about you.</li>
              <li><strong className="text-foreground">Correct</strong> any inaccurate data.</li>
              <li><strong className="text-foreground">Delete</strong> your data (the "right to be forgotten").</li>
              <li><strong className="text-foreground">Object</strong> to how we use your data.</li>
              <li><strong className="text-foreground">Portability</strong> — receive your data in a portable format.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">To exercise any of these rights, email us at <a href="mailto:economicsastar@gmail.com" className="text-emerald underline">economicsastar@gmail.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with the ICO at ico.org.uk.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Children's privacy</h2>
            <p className="text-muted-foreground leading-relaxed">EconAStar is designed for A-Level students aged 16–18. Under UK GDPR, students aged 13 and over can consent to online services independently. We apply the ICO's Children's Code (Age Appropriate Design Code) standards: we collect only the minimum data necessary, we do not use profiling for advertising, and privacy settings are set to high by default. If you are a parent and have concerns about your child's data, please contact us.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">We use essential cookies to keep you logged in. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, but this will prevent you from staying logged in.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Changes to this policy</h2>
            <p className="text-muted-foreground leading-relaxed">We may update this policy from time to time. We will notify you of significant changes by email. The date at the top of this page shows when it was last updated.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">For any privacy-related questions, email <a href="mailto:economicsastar@gmail.com" className="text-emerald underline">economicsastar@gmail.com</a>.</p>
          </section>

        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
