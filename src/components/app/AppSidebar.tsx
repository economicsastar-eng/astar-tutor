import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import { Home, BookOpen, Brain, PenLine, MessageCircle, TrendingUp, Settings, MessagesSquare, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type NavItem = {
  to: "/dashboard" | "/course" | "/review" | "/flashcards" | "/essay-marker" | "/tutor" | "/progress" | "/account";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: boolean;
};

const items: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", Icon: Home },
  { to: "/course", label: "Course", Icon: BookOpen },
  { to: "/review", label: "Review", Icon: Brain, badge: true },
  { to: "/flashcards", label: "Flashcards", Icon: Layers },
  { to: "/essay-marker", label: "Essay Marker", Icon: PenLine },
  { to: "/tutor", label: "Tutor", Icon: MessageCircle },
  { to: "/progress", label: "Progress", Icon: TrendingUp },
  { to: "/account", label: "Account", Icon: Settings },
];

export function AppSidebar({ dueReviews }: { dueReviews: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-[250px] bg-[#0f1c2e] border-r border-white/5 flex-col z-30">
      <div className="px-6 py-5 border-b border-white/5">
        <Link to="/dashboard" className="inline-flex items-baseline font-display font-extrabold text-2xl tracking-tight text-white">
          EconA<span className="text-gold">*</span><span className="text-white">star</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, Icon, badge }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald/15 text-emerald border-l-2 border-emerald pl-[10px]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && dueReviews > 0 && (
                <span className="rounded-full bg-gold/20 text-gold text-xs font-semibold px-2 py-0.5 min-w-[22px] text-center">
                  {dueReviews}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-white/5 space-y-2">
        <a
          href="https://discord.gg/econastar"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald px-3 py-2"
        >
          <MessagesSquare className="size-3.5" />
          Join the Community
        </a>
        <button
          onClick={handleSignOut}
          className="w-full text-left text-xs text-slate-500 hover:text-slate-300 px-3 py-2 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
