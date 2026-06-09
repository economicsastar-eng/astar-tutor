import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get started — EconAStar" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Logo variant="light" />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg text-center space-y-6">
          <h1 className="text-3xl font-bold font-heading">You're in 🎉</h1>
          <p className="text-muted-foreground">
            Welcome to EconAStar. We'll be adding a short onboarding flow here soon — for now, head straight to your dashboard.
          </p>
          <Button
            onClick={() => navigate({ to: "/dashboard" })}
            className="bg-emerald hover:bg-emerald-hover text-white font-semibold"
          >
            Go to dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
