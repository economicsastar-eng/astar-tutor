import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo variant="light" />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground transition">How it works</a>
          <a href="#compare" className="hover:text-foreground transition">vs UpLearn</a>
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Log in</Link>
          </Button>
          <Button size="sm" className="bg-emerald hover:bg-emerald-hover text-white font-semibold" asChild>
            <Link to="/">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
