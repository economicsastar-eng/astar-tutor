import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EconAStar" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    supabase.from("profiles").select("name").maybeSingle().then(({ data }) => {
      if (data?.name) setName(data.name);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo variant="light" />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold font-heading">Welcome{name ? `, ${name.split(" ")[0]}` : ""} 👋</h1>
        <p className="text-muted-foreground mt-2">Your dashboard is being built. The course content lands here next.</p>
      </main>
    </div>
  );
}
