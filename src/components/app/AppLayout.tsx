import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { MobileTabBar } from "./MobileTabBar";
import { supabase } from "@/integrations/supabase/client";

export type ProfileSummary = {
  id: string;
  name: string;
  current_streak: number;
  daily_target: number;
  exam_board: string;
  year_group: string;
  target_grade: string;
  exam_date: string | null;
  plan: string;
  onboarding_completed: boolean;
};

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [dueReviews, setDueReviews] = useState(0);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      // keep dark while in authed area; root layout sets light again
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select(
          "id,name,current_streak,daily_target,exam_board,year_group,target_grade,exam_date,plan,onboarding_completed",
        )
        .eq("id", userData.user.id)
        .maybeSingle();
      if (!cancel && p) setProfile(p as ProfileSummary);

      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from("review_queue")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userData.user.id)
        .eq("is_mastered", false)
        .lte("next_review_date", today);
      if (!cancel) setDueReviews(count ?? 0);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="dark min-h-screen flex w-full bg-[#0f1c2e] text-foreground">
      <AppSidebar dueReviews={dueReviews} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[250px] pb-16 md:pb-0">
        <AppTopBar title={title} profile={profile} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 md:py-10">
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar dueReviews={dueReviews} />
    </div>
  );
}
