import { Link, useRouterState } from "@tanstack/react-router";
import type { ComponentType, SVGProps } from "react";
import { Home, BookOpen, Brain, PenLine, MessageCircle } from "lucide-react";

type TabItem = {
  to: "/dashboard" | "/course" | "/review" | "/essay-marker" | "/tutor";
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: boolean;
};

const items: TabItem[] = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/course", label: "Course", Icon: BookOpen },
  { to: "/review", label: "Review", Icon: Brain, badge: true },
  { to: "/essay-marker", label: "Essay", Icon: PenLine },
  { to: "/tutor", label: "Tutor", Icon: MessageCircle },
];

export function MobileTabBar({ dueReviews }: { dueReviews: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#0f1c2e] border-t border-white/5 z-30 flex">
      {items.map(({ to, label, Icon, badge }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium relative ${
              active ? "text-emerald" : "text-slate-400"
            }`}
          >
            <div className="relative">
              <Icon className="size-5" />
              {badge && dueReviews > 0 && (
                <span className="absolute -top-1.5 -right-2 rounded-full bg-gold text-[#0f1c2e] text-[9px] font-bold px-1.5 py-0.5 min-w-[16px] text-center leading-none">
                  {dueReviews}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
