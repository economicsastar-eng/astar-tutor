import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Flame, TrendingUp, CheckCircle2, Brain, Target, Clock, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EconAStar" }] }),
  component: DashboardPage,
});

type Stats = {
  streak: number;
  predictedGrade: string;
  predictedGradeColor: string;
  courseProgress: number;
  reviewsDue: number;
  dailyTarget: number;
  doneToday: number;
  examDays: number | null;
};

type ContinueLesson = {
  title: string;
  sectionTitle: string;
  slug: string;
  sectionNumber: number;
  progressPercent: number;
  isFirstLesson: boolean;
};

function gradeFromAccuracy(accuracy: number, attempts: number): { grade: string; color: string } {
  if (attempts < 20) return { grade: "?", color: "text-slate-400" };
  if (accuracy >= 90) return { grade: "A*", color: "text-gold" };
  if (accuracy >= 80) return { grade: "A", color: "text-emerald" };
  if (accuracy >= 70) return { grade: "B", color: "text-emerald" };
  if (accuracy >= 60) return { grade: "C", color: "text-white" };
  if (accuracy >= 50) return { grade: "D", color: "text-white" };
  if (accuracy >= 40) return { grade: "E", color: "text-white" };
  return { grade: "U", color: "text-incorrect" };
}

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [stats, setStats] = useState<Stats>({
    streak: 0,
    predictedGrade: "?",
    predictedGradeColor: "text-slate-400",
    courseProgress: 0,
    reviewsDue: 0,
    dailyTarget: 2,
    doneToday: 0,
    examDays: null,
  });
  const [cont, setCont] = useState<ContinueLesson | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const userId = u.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name,current_streak,daily_target,exam_date,onboarding_completed")
        .eq("id", userId)
        .maybeSingle();

      if (profile && !profile.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }

      setName(profile?.name?.split(" ")[0] ?? "");

      // Quiz attempts for predicted grade
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("is_correct")
        .eq("user_id", userId);
      const total = attempts?.length ?? 0;
      const correct = attempts?.filter((a) => a.is_correct).length ?? 0;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      const grade = gradeFromAccuracy(accuracy, total);

      // Course progress
      const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
        supabase.from("lessons").select("id", { count: "exact", head: true }),
        supabase
          .from("lesson_completions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      const courseProgress =
        totalLessons && totalLessons > 0
          ? Math.round(((completedLessons ?? 0) / totalLessons) * 100)
          : 0;

      // Reviews due
      const today = new Date().toISOString().slice(0, 10);
      const { count: reviews } = await supabase
        .from("review_queue")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_mastered", false)
        .lte("next_review_date", today);

      // Done today
      const startOfDay = `${today}T00:00:00.000Z`;
      const { count: doneToday } = await supabase
        .from("lesson_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("completed_at", startOfDay);

      // Exam countdown
      let examDays: number | null = null;
      if (profile?.exam_date) {
        const exam = new Date(profile.exam_date as unknown as string);
        const diff = Math.ceil((exam.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        examDays = diff >= 0 ? diff : null;
      }

      // Continue learning
      const { data: progressRow } = await supabase
        .from("lesson_progress")
        .select("lesson_id,current_block_order,updated_at,lessons(title,slug,sections(theme_number,title))")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progressRow && (progressRow as any).lessons) {
        const lesson = (progressRow as any).lessons;
        const { count: blockCount } = await supabase
          .from("lesson_blocks")
          .select("id", { count: "exact", head: true })
          .eq("lesson_id", progressRow.lesson_id);
        const pct =
          blockCount && blockCount > 0
            ? Math.round((progressRow.current_block_order / blockCount) * 100)
            : 0;
        setCont({
          title: lesson.title,
          sectionTitle: lesson.sections?.title ?? "",
          sectionNumber: lesson.sections?.theme_number ?? 1,
          slug: lesson.slug,
          progressPercent: Math.min(pct, 100),
          isFirstLesson: false,
        });
      } else {
        // First lesson
        const { data: firstLesson } = await supabase
          .from("lessons")
          .select("title,slug,sections(theme_number,title)")
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (firstLesson) {
          setCont({
            title: firstLesson.title,
            sectionTitle: (firstLesson as any).sections?.title ?? "",
            sectionNumber: (firstLesson as any).sections?.theme_number ?? 1,
            slug: firstLesson.slug,
            progressPercent: 0,
            isFirstLesson: true,
          });
        }
      }

      setStats({
        streak: profile?.current_streak ?? 0,
        predictedGrade: grade.grade,
        predictedGradeColor: grade.color,
        courseProgress,
        reviewsDue: reviews ?? 0,
        dailyTarget: profile?.daily_target ?? 2,
        doneToday: doneToday ?? 0,
        examDays,
      });
      setLoading(false);
    })();
  }, [navigate]);

  const targetHit = stats.doneToday >= stats.dailyTarget;
  const examColor =
    stats.examDays === null
      ? ""
      : stats.examDays > 60
        ? "text-emerald"
        : stats.examDays > 30
          ? "text-gold"
          : "text-incorrect";

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {!loading && (
          <h2 className="text-2xl font-display font-bold text-white">
            Welcome back{name ? `, ${name}` : ""} 👋
          </h2>
        )}

        {/* Continue Learning */}
        {cont && (
          <div className="rounded-xl bg-[#1a2744] border border-white/5 border-l-4 border-l-emerald p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                {cont.isFirstLesson ? "Ready to start?" : "Continue where you left off"}
              </p>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1 truncate">
                {cont.title}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Section {cont.sectionNumber}: {cont.sectionTitle}
              </p>
              {!cont.isFirstLesson && (
                <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-md">
                  <div
                    className="h-full bg-emerald transition-all"
                    style={{ width: `${cont.progressPercent}%` }}
                  />
                </div>
              )}
            </div>
            <Button asChild className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold shrink-0">
              <Link to="/course">
                {cont.isFirstLesson ? "Start Your First Lesson" : "Continue"}
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Flame className="size-5 text-gold" />} value={String(stats.streak)} label={stats.streak === 1 ? "day streak" : "day streak"} />
          <StatCard
            icon={<TrendingUp className="size-5 text-emerald" />}
            value={<span className={stats.predictedGradeColor}>{stats.predictedGrade}</span>}
            label={stats.predictedGrade === "?" ? "complete more quizzes" : "predicted grade"}
          />
          <StatCard icon={<CheckCircle2 className="size-5 text-emerald" />} value={`${stats.courseProgress}%`} label="course complete" />
          <StatCard
            icon={<Brain className={`size-5 ${stats.reviewsDue > 0 ? "text-gold" : "text-slate-400"}`} />}
            value={<span className={stats.reviewsDue > 0 ? "text-gold animate-pulse-soft" : ""}>{stats.reviewsDue}</span>}
            label="reviews due"
          />
        </div>

        {/* Daily target */}
        <div className={`rounded-xl bg-[#1a2744] border ${targetHit ? "border-gold/50" : "border-white/5"} p-5 sm:p-6`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className={`size-5 ${targetHit ? "text-gold" : "text-emerald"}`} />
            <h3 className="font-display font-semibold text-white">
              {targetHit ? "🎯 Target hit! Come back tomorrow." : `Today's goal: Complete ${stats.dailyTarget} lessons`}
            </h3>
          </div>
          {!targetHit && (
            <>
              <p className="text-sm text-slate-400 mb-2">
                {stats.doneToday} / {stats.dailyTarget} done today
              </p>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald transition-all"
                  style={{ width: `${Math.min((stats.doneToday / stats.dailyTarget) * 100, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Exam countdown */}
        {stats.examDays !== null ? (
          <div className="rounded-xl bg-[#1a2744] border border-white/5 p-5 flex items-center gap-3">
            <Clock className={`size-5 ${examColor}`} />
            <span className={`font-display font-semibold ${examColor}`}>
              {stats.examDays} days until your exam
            </span>
          </div>
        ) : (
          <Link to="/account" className="block text-sm text-slate-400 hover:text-emerald">
            Set your exam date in Account →
          </Link>
        )}

        {/* Weakest topics */}
        <div>
          <h3 className="font-display font-semibold text-white mb-3">Your Weakest Topics</h3>
          <div className="rounded-xl bg-[#1a2744] border border-white/5 p-5 text-sm text-slate-400">
            Complete some lessons to see your weakest topics here.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl bg-[#1a2744] border border-white/5 p-4 sm:p-5">
      <div className="mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl font-display font-bold text-white leading-none">{value}</div>
      <div className="text-xs text-slate-400 mt-1.5">{label}</div>
    </div>
  );
}
