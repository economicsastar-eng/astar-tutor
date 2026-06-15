import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-sm">
            <Logo variant="light" showTagline />
          </div>
          <div className="flex gap-10 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Product</p>
              <a href="#features" className="block text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#faq" className="block text-muted-foreground hover:text-foreground">FAQ</a>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Legal</p>
              <a href="#" className="block text-muted-foreground hover:text-foreground">Privacy</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground">Terms</a>
              <a href="mailto:economicsastar@gmail.com" className="block text-muted-foreground hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground space-y-1">
          <p>© 2026 EconAStar. All rights reserved.</p>
          <p>EconAStar is an independent platform. Not affiliated with AQA, Edexcel, OCR, or WJEC. Content verified by a practising A-Level Economics tutor.</p>
        </div>
      </div>
    </footer>
  );
}
