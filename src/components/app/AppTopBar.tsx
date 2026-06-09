import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProfileSummary } from "./AppLayout";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

export function AppTopBar({ title, profile }: { title: string; profile: ProfileSummary | null }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="h-14 bg-[#1a2744] border-b border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <h1 className="text-base sm:text-lg font-display font-semibold text-white truncate">{title}</h1>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <Flame className="size-4 text-gold" />
          <span>{profile?.current_streak ?? 0}</span>
        </div>
        <div className="hidden sm:block h-5 w-px bg-white/10" />
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="size-9 rounded-full bg-emerald text-emerald-foreground text-sm font-semibold flex items-center justify-center cursor-pointer hover:bg-emerald-hover transition-colors"
              aria-label="Profile menu"
            >
              {initials(profile?.name ?? "")}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {profile?.name && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Signed in as<br />
                <span className="text-foreground font-medium">{profile.name}</span>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/progress">Progress</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/account">Account</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
