import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Which exam boards do you cover?", a: "AQA, Edexcel, OCR, and WJEC. You select your board during onboarding and content adapts to your specification." },
  { q: "What's included in the free tier?", a: "Full access to Theme 1 (Markets and Market Failure), 3 tutor messages per day, and progress tracking. No card required." },
  { q: "Can I cancel the monthly plan anytime?", a: "Yes. Cancel from your account in one click. You keep access until the end of your current billing period and your progress is saved." },
  { q: "How is the essay marker different from other platforms?", a: "It quotes your actual words back to you, handles graph and diagram questions (when you describe them), and gives specific, actionable feedback — not generic 'add more evaluation' advice." },
  { q: "How does the Test Out feature work?", a: "Score 80%+ on a 5-question entry quiz for any lesson and we mark it complete and move you on. No need to sit through topics you already know." },
  { q: "Is this suitable for Year 12 and Year 13?", a: "Yes. Year 12s get the 2028 plan with Y12→Y13 transition content. Year 13s get the 2027 plan focused on exam-year revision." },
  { q: "What if I'm not happy?", a: "7-day refund policy — no questions asked. Email us and we'll process it." },
  { q: "How is this different from Seneca, PMT, or Save My Exams?", a: "Those are great free resources but don't give you essay marking, a tutor, adaptive review, or a structured course in order. EconAStar is the structured layer on top." },
  { q: "Do I need anything else alongside EconAStar?", a: "No. We cover everything on your specification. Some students like to do extra past papers from their exam board's website — those are free and we link to them." },
  { q: "Is my data safe?", a: "Yes. ICO registered, GDPR compliant, no data sold to third parties. You can download or delete your data anytime from your account page." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
