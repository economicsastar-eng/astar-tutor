import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Flame,
  TrendingUp,
  CheckCircle2,
  Brain,
  Target,
  Clock,
  ChevronRight,
  Info,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EconAStar" }] }),
  component: DashboardPage,
});

type WeakTopic = {
  lessonId: string;
  slug: string;
  title: string;
  specRef: string;
  percent: number;
  attempted: number;
};

type Stats = {
  streak: number;
  predictedGrade: string;
  predictedGradeColor: string;
  hasEnoughQuizzes: boolean;
  courseProgress: number;
  reviewsDue: number;
  dailyTarget: number;
  doneToday: number;
  examDays: number | null;
  examLabel: string;
};

type ContinueLesson = {
  title: string;
  sectionTitle: string;
  slug: string;
  sectionNumber: number;
  progressPercent: number;
  isFirstLesson: boolean;
};

function gradeFromAccuracy(accuracy: number): { grade: string; color: string } {
  if (accuracy >= 90) return { grade: "A*", color: "text-gold" };
  if (accuracy >= 80) return { grade: "A", color: "text-emerald" };
  if (accuracy >= 70) return { grade: "B", color: "text-emerald" };
  if (accuracy >= 60) return { grade: "C", color: "text-white" };
  if (accuracy >= 50) return { grade: "D", color: "text-white" };
  if (accuracy >= 40) return { grade: "E", color: "text-white" };
  return { grade: "U", color: "text-incorrect" };
}

function firstThursdayOfJune(year: number): Date {
  const d = new Date(Date.UTC(year, 5, 1));
  // 4 = Thursday
  const offset = (4 - d.getUTCDay() + 7) % 7;
  d.setUTCDate(1 + offset);
  return d;
}

function defaultPaper1Date(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const thisYear = firstThursdayOfJune(year);
  return now > thisYear ? firstThursdayOfJune(year + 1) : thisYear;
}

function streakLine(streak: number): string {
  if (streak === 0) return "Start your streak today";
  if (streak === 1) return "1 day — keep it going!";
  if (streak < 7) return `${streak} days — you're building momentum`;
  if (streak < 30) return `${streak} days 🔥 — you're on a roll`;
  return `${streak} days 🔥🔥 — incredible consistency`;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [stats, setStats] = useState<Stats>({
    streak: 0,
    predictedGrade: "?",
    predictedGradeColor: "text-slate-400",
    hasEnoughQuizzes: false,
    courseProgress: 0,
    reviewsDue: 0,
    dailyTarget: 2,
    doneToday: 0,
    examDays: null,
    examLabel: "Paper 1",
  });
  const [cont, setCont] = useState<ContinueLesson | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [flashcardsDue, setFlashcardsDue] = useState(0);

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

      // Quiz attempts — latest per question
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("question_id,lesson_id,is_correct,attempted_at")
        .eq("user_id", userId)
        .order("attempted_at", { ascending: true });

      const latestByQ = new Map<string, { lesson_id: string | null; is_correct: boolean }>();
      for (const a of attempts ?? []) {
        latestByQ.set(a.question_id, { lesson_id: a.lesson_id, is_correct: a.is_correct });
      }
      const totalQuestions = latestByQ.size;
      const correctCount = Array.from(latestByQ.values()).filter((v) => v.is_correct).length;
      const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
      const hasEnough = totalQuestions >= 10;
      const grade = hasEnough
        ? gradeFromAccuracy(accuracy)
        : { grade: "?", color: "text-slate-400" };

      // Course progress
      const [{ count: totalLessons }, { count: completedLessons }, { data: completionRows }] =
        await Promise.all([
          supabase.from("lessons").select("id", { count: "exact", head: true }),
          supabase
            .from("lesson_completions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("lesson_completions")
            .select("lesson_id")
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
      let examLabel = "Paper 1";
      const examTarget = profile?.exam_date
        ? new Date(profile.exam_date as unknown as string)
        : defaultPaper1Date();
      const diff = Math.ceil(
        (examTarget.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      examDays = diff >= 0 ? diff : null;
      if (!profile?.exam_date) examLabel = "Paper 1";

      // Next lesson — lowest sort_order incomplete (joined with section sort)
      const completedIds = new Set((completionRows ?? []).map((r) => r.lesson_id));
      const { data: allLessons } = await supabase
        .from("lessons")
        .select("id,title,slug,sort_order,section_id,sections(theme_number,title,sort_order)")
        .order("sort_order", { ascending: true });

      const ordered = ((allLessons ?? []) as any[]).sort((a, b) => {
        const sa = a.sections?.sort_order ?? 0;
        const sb = b.sections?.sort_order ?? 0;
        if (sa !== sb) return sa - sb;
        return a.sort_order - b.sort_order;
      });
      const nextLesson = ordered.find((l) => !completedIds.has(l.id));
      if (nextLesson) {
        // determine in-progress percent
        const { count: blockCount } = await supabase
          .from("lesson_blocks")
          .select("id", { count: "exact", head: true })
          .eq("lesson_id", nextLesson.id);
        const { data: progressRow } = await supabase
          .from("lesson_progress")
          .select("current_block_order")
          .eq("user_id", userId)
          .eq("lesson_id", nextLesson.id)
          .maybeSingle();
        const cur = progressRow?.current_block_order ?? 0;
        const pct =
          blockCount && blockCount > 0 ? Math.min(100, Math.round((cur / blockCount) * 100)) : 0;
        setCont({
          title: nextLesson.title,
          sectionTitle: nextLesson.sections?.title ?? "",
          sectionNumber: nextLesson.sections?.theme_number ?? 1,
          slug: nextLesson.slug,
          progressPercent: pct,
          isFirstLesson: completedIds.size === 0,
        });
      } else {
        setCont(null);
      }

      // Weakest topics
      const perLesson = new Map<string, { correct: number; total: number }>();
      for (const v of latestByQ.values()) {
        if (!v.lesson_id) continue;
        const e = perLesson.get(v.lesson_id) ?? { correct: 0, total: 0 };
        e.total += 1;
        if (v.is_correct) e.correct += 1;
        perLesson.set(v.lesson_id, e);
      }
      const weakIds = Array.from(perLesson.entries())
        .filter(([, v]) => v.total >= 3)
        .map(([id, v]) => ({ id, percent: (v.correct / v.total) * 100, total: v.total }))
        .sort((a, b) => a.percent - b.percent)
        .slice(0, 3);
      if (weakIds.length > 0) {
        const { data: lessonInfo } = await supabase
          .from("lessons")
          .select("id,title,slug,spec_reference")
          .in("id", weakIds.map((w) => w.id));
        const info = new Map((lessonInfo ?? []).map((l) => [l.id, l]));
        setWeakTopics(
          weakIds.map((w) => {
            const li = info.get(w.id);
            return {
              lessonId: w.id,
              slug: li?.slug ?? "",
              title: li?.title ?? "",
              specRef: li?.spec_reference ?? "",
              percent: Math.round(w.percent),
              attempted: w.total,
            };
          }),
        );
      } else {
        setWeakTopics([]);
      }

      // Flashcards due (unseen + due progress)
      const [{ count: totalFlashcards }, { data: fcProgress }] = await Promise.all([
        supabase.from("flashcards").select("id", { count: "exact", head: true }),
        supabase
          .from("flashcard_progress")
          .select("card_id,next_due_at")
          .eq("user_id", userId),
      ]);
      const seenIds = new Set((fcProgress ?? []).map((r: any) => r.card_id));
      const dueSeen = (fcProgress ?? []).filter(
        (r: any) => new Date(r.next_due_at).getTime() <= Date.now(),
      ).length;
      const unseen = Math.max(0, (totalFlashcards ?? 0) - seenIds.size);
      setFlashcardsDue(dueSeen + unseen);

      setStats({
        streak: profile?.current_streak ?? 0,
        predictedGrade: grade.grade,
        predictedGradeColor: grade.color,
        hasEnoughQuizzes: hasEnough,
        courseProgress,
        reviewsDue: reviews ?? 0,
        dailyTarget: profile?.daily_target ?? 2,
        doneToday: doneToday ?? 0,
        examDays,
        examLabel,
      });
      setLoading(false);
    })();
  }, [navigate]);

  const targetHit = stats.doneToday >= stats.dailyTarget;
  const examColor =
    stats.examDays === null
      ? ""
      : stats.examDays > 90
        ? "text-emerald"
        : stats.examDays >= 30
          ? "text-gold"
          : "text-incorrect";

  return (
    <TooltipProvider delayDuration={150}>
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
                {!cont.isFirstLesson && cont.progressPercent > 0 && (
                  <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-md">
                    <div
                      className="h-full bg-emerald transition-all"
                      style={{ width: `${cont.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
              <Button
                asChild
                className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold shrink-0"
              >
                <Link to="/course/$lessonId" params={{ lessonId: cont.slug }}>
                  {cont.isFirstLesson ? "Start Your First Lesson" : "Continue"}
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Flame className="size-5 text-gold" />}
              value={String(stats.streak)}
              label={streakLine(stats.streak)}
              tooltip="A streak day = completing at least 1 lesson block. Come back daily to keep it alive."
            />
            {stats.hasEnoughQuizzes ? (
              <StatCard
                icon={<TrendingUp className="size-5 text-emerald" />}
                value={<span className={stats.predictedGradeColor}>{stats.predictedGrade}</span>}
                label="predicted grade"
              />
            ) : (
              <div className="rounded-xl bg-[#1a2744] border border-white/5 p-4 sm:p-5 flex flex-col">
                <div className="mb-2">
                  <TrendingUp className="size-5 text-slate-400" />
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  Answer 10+ questions to unlock your predicted grade
                </div>
              </div>
            )}
            <StatCard
              icon={<CheckCircle2 className="size-5 text-emerald" />}
              value={`${stats.courseProgress}%`}
              label="course complete"
            />
            <Link to="/review" className="block">
              <StatCard
                icon={
                  <Brain
                    className={`size-5 ${stats.reviewsDue > 0 ? "text-gold" : "text-slate-400"}`}
                  />
                }
                value={
                  <span className={stats.reviewsDue > 0 ? "text-gold animate-pulse-soft" : ""}>
                    {stats.reviewsDue}
                  </span>
                }
                label="reviews due"
                hoverable
              />
            </Link>
          </div>

          {/* Daily target */}
          <div
            className={`rounded-xl bg-[#1a2744] border ${targetHit ? "border-gold/50" : "border-white/5"} p-5 sm:p-6`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className={`size-5 ${targetHit ? "text-gold" : "text-emerald"}`} />
              <h3 className="font-display font-semibold text-white">
                {targetHit
                  ? "🎯 Target hit! Come back tomorrow."
                  : `Today's goal: Complete ${stats.dailyTarget} lessons`}
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
                    style={{
                      width: `${Math.min((stats.doneToday / stats.dailyTarget) * 100, 100)}%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Exam countdown */}
          {stats.examDays !== null && (
            <div className="rounded-xl bg-[#1a2744] border border-white/5 p-5 flex items-center gap-3">
              <Clock className={`size-5 ${examColor}`} />
              <span className={`font-display font-semibold ${examColor}`}>
                {stats.examDays} days to {stats.examLabel}
              </span>
            </div>
          )}

          {/* Weakest topics */}
          <div>
            <h3 className="font-display font-semibold text-white mb-3">Your Weakest Topics</h3>
            {weakTopics.length === 0 ? (
              <div className="rounded-xl bg-[#1a2744] border border-white/5 p-5 text-sm text-slate-400">
                Attempt at least 3 questions in a lesson to see your weakest topics here.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {weakTopics.map((w) => (
                  <div
                    key={w.lessonId}
                    className="rounded-xl bg-[#1a2744] border border-white/5 p-5 flex flex-col gap-2"
                  >
                    <h4 className="font-display font-semibold text-white">{w.title}</h4>
                    {w.specRef && (
                      <p className="text-xs text-slate-400">{w.specRef}</p>
                    )}
                    <p
                      className={`text-2xl font-display font-bold ${w.percent < 50 ? "text-incorrect" : w.percent < 70 ? "text-gold" : "text-emerald"}`}
                    >
                      {w.percent}%
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold mt-auto self-start"
                    >
                      <Link to="/course/$lessonId" params={{ lessonId: w.slug }}>
                        Revise Now
                      </Link>
                    </Button>
                  </div>
                ))}
                {weakTopics.length < 3 && (
                  <div className="rounded-xl bg-[#1a2744] border border-white/5 border-dashed p-5 text-sm text-slate-400 flex items-center">
                    Attempt more quiz questions to surface additional weak topics.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </TooltipProvider>
  );
}

function StatCard({
  icon,
  value,
  label,
  tooltip,
  hoverable,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tooltip?: string;
  hoverable?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-[#1a2744] border border-white/5 p-4 sm:p-5 ${hoverable ? "hover:border-emerald/40 transition-colors cursor-pointer" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        {icon}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-300"
                onClick={(e) => e.preventDefault()}
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-display font-bold text-white leading-none">
        {value}
      </div>
      <div className="text-xs text-slate-400 mt-1.5">{label}</div>
    </div>
  );
}
