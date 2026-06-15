import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/course/")({
  head: () => ({ meta: [{ title: "Course — EconAStar" }] }),
  component: CoursePage,
});

type Lesson = {
  id: string;
  section_id: string;
  title: string;
  slug: string;
  spec_reference: string;
  estimated_minutes: number;
  sort_order: number;
};
type LessonState = {
  lesson: Lesson;
  blockCount: number;
  hasQuestions: boolean;
  completed: boolean;
  inProgress: boolean;
  progressPercent: number;
  unlocked: boolean;
  status: "locked" | "available" | "in_progress" | "completed";
};

const SUBSECTION_NAMES: Record<string, string> = {
  // Theme 1
  "3.1.1": "Economic Methodology and the Economic Problem",
  "3.1.2": "Individual Economic Decision Making",
  "3.1.3": "Price Determination in a Competitive Market",
  "3.1.4": "Production, Costs and Revenue",
  "3.1.5": "Perfect Competition, Imperfectly Competitive Markets and Monopoly",
  "3.1.6": "The Labour Market",
  "3.1.7": "The Distribution of Income and Wealth: Poverty and Inequality",
  "3.1.8": "The Market Mechanism, Market Failure and Government Intervention",
  // Theme 2
  "3.2.1": "The Measurement of Macroeconomic Performance",
  "3.2.2": "How the Macroeconomy Works",
  "3.2.3": "Economic Performance",
  "3.2.4": "Financial Markets and Monetary Policy",
  "3.2.5": "Fiscal Policy and Supply-Side Policies",
  "3.2.6": "The International Economy",
};

// AQA spec hierarchy: 2 top-level sections, each containing 2 themes,
// each theme containing a fixed set of subsection codes.
type AqaTheme = {
  number: number;
  title: string;
  subsections: string[];
};
type AqaSection = {
  code: string;
  title: string;
  themes: AqaTheme[];
};

const AQA_SECTIONS: AqaSection[] = [
  {
    code: "3.1",
    title: "Individuals, Firms, Markets and Market Failure",
    themes: [
      {
        number: 1,
        title: "Markets and Market Failure",
        subsections: ["3.1.1", "3.1.2", "3.1.3"],
      },
      {
        number: 3,
        title: "Business Behaviour & The Labour Market",
        subsections: ["3.1.4", "3.1.5", "3.1.6", "3.1.7", "3.1.8"],
      },
    ],
  },
  {
    code: "3.2",
    title: "The National and International Economy",
    themes: [
      {
        number: 2,
        title: "The National Economy",
        subsections: ["3.2.1", "3.2.2", "3.2.3"],
      },
      {
        number: 4,
        title: "A Global Perspective",
        subsections: ["3.2.4", "3.2.5", "3.2.6"],
      },
    ],
  },
];


type Subsection = {
  code: string;
  name: string;
  lessons: LessonState[];
};

function subsectionCode(specRef: string | null | undefined): string | null {
  if (!specRef) return null;
  const parts = specRef.split(".");
  if (parts.length < 3) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function groupLessonsBySubsection(
  lessons: LessonState[],
  subsectionOrder: string[],
): Subsection[] {
  const groups = new Map<string, LessonState[]>();
  for (const ls of lessons) {
    const code = subsectionCode(ls.lesson.spec_reference);
    if (!code) continue;
    const arr = groups.get(code) ?? [];
    arr.push(ls);
    groups.set(code, arr);
  }
  const result: Subsection[] = [];
  for (const code of subsectionOrder) {
    const subLessons = groups.get(code);
    if (!subLessons || subLessons.length === 0) continue;
    subLessons.sort((a, b) => a.lesson.sort_order - b.lesson.sort_order);
    result.push({ code, name: SUBSECTION_NAMES[code] ?? code, lessons: subLessons });
  }
  return result;
}


function SubsectionGroup({
  sub,
  onTestOut,
}: {
  sub: Subsection;
  onTestOut: (lesson: Lesson) => void;
}) {
  const [open, setOpen] = useState(true);
  const completed = sub.lessons.filter((l) => l.completed).length;
  const pct = sub.lessons.length > 0 ? Math.round((completed / sub.lessons.length) * 100) : 0;
  return (
    <div className="border-t border-white/5 first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-display font-semibold text-white/90 truncate">
            {sub.code !== "other" ? `${sub.code} ${sub.name}` : sub.name}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {completed} / {sub.lessons.length} lessons complete
          </p>
          <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden max-w-sm">
            <div className="h-full bg-emerald transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {open ? (
          <ChevronDown className="size-4 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-slate-500 shrink-0" />
        )}
      </button>
      {open && (
        <div className="divide-y divide-white/5 border-t border-white/5 bg-black/10">
          {sub.lessons.map((ls) => (
            <LessonRow key={ls.lesson.id} state={ls} onTestOut={() => onTestOut(ls.lesson)} />
          ))}
        </div>
      )}
    </div>
  );
}


function CoursePage() {
  const [loading, setLoading] = useState(true);
  const [allLessonStates, setAllLessonStates] = useState<LessonState[]>([]);
  const [openSectionCode, setOpenSectionCode] = useState<string | null>(null);
  const [testOutLesson, setTestOutLesson] = useState<Lesson | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const userId = u.user.id;

      const [{ data: lessons }, { data: blocks }, { data: completions }, { data: progress }, { data: questions }, { data: profile }] =
        await Promise.all([
          supabase.from("lessons").select("*").order("sort_order"),
          supabase.from("lesson_blocks").select("lesson_id"),
          supabase.from("lesson_completions").select("lesson_id").eq("user_id", userId),
          supabase
            .from("lesson_progress")
            .select("lesson_id,current_block_order")
            .eq("user_id", userId),
          supabase.from("quiz_questions").select("lesson_id"),
          supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
        ]);

      if (cancel) return;

      const isPaid = (profile?.plan ?? "free") !== "free";

      const blockCounts = new Map<string, number>();
      (blocks ?? []).forEach((b) => blockCounts.set(b.lesson_id, (blockCounts.get(b.lesson_id) ?? 0) + 1));
      const questionLessons = new Set((questions ?? []).map((q) => q.lesson_id));
      const completedSet = new Set((completions ?? []).map((c) => c.lesson_id));
      const progressMap = new Map<string, number>();
      (progress ?? []).forEach((p) => progressMap.set(p.lesson_id, p.current_block_order));

      const allLessons = (lessons ?? []) as Lesson[];

      // Free tier: only Theme 1 (subsections 3.1.1, 3.1.2, 3.1.3) unlocks.
      // Theme 3 (3.1.4–3.1.8) is paid content.
      const isUnlocked = (l: Lesson) => {
        if (isPaid) return true;
        if (!l.spec_reference) return false;
        const sub = l.spec_reference.split(".").slice(0, 3).join(".");
        return sub === "3.1.1" || sub === "3.1.2" || sub === "3.1.3";
      };

      const states: LessonState[] = allLessons.map((l) => {
        const bc = blockCounts.get(l.id) ?? 0;
        const completed = completedSet.has(l.id);
        const cur = progressMap.get(l.id) ?? 0;
        const inProgress = !completed && cur > 0;
        const unlocked = isUnlocked(l);
        const pct = bc > 0 ? Math.min(100, Math.round((cur / bc) * 100)) : 0;
        return {
          lesson: l,
          blockCount: bc,
          hasQuestions: questionLessons.has(l.id),
          completed,
          inProgress,
          progressPercent: pct,
          unlocked,
          status: completed
            ? "completed"
            : !unlocked
              ? "locked"
              : inProgress
                ? "in_progress"
                : "available",
        };
      });

      setAllLessonStates(states);

      // Auto-open the first AQA section that still has work to do.
      const firstActive = AQA_SECTIONS.find((sec) =>
        states.some((s) => {
          const code = subsectionCode(s.lesson.spec_reference);
          if (!code) return false;
          return (
            sec.themes.some((t) => t.subsections.includes(code)) &&
            (s.status === "in_progress" || s.status === "available")
          );
        }),
      );
      setOpenSectionCode((prev) => prev ?? firstActive?.code ?? AQA_SECTIONS[0].code);
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [refreshKey]);


  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const hasAnyLesson = allLessonStates.length > 0;

  return (
    <AppLayout title="Course">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Your A-Level Economics course</h2>
          <p className="text-slate-400 text-sm mt-1">
            Work through lessons in order — or test out of anything you already know.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center text-slate-400">
            Loading your course…
          </div>
        ) : !hasAnyLesson ? (
          <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center text-slate-400">
            No course content yet — check back soon.
          </div>
        ) : (
          <div className="space-y-3">
            {AQA_SECTIONS.map((sec) => {
              // Lessons that belong to this AQA section (by subsection code).
              const subsetCodes = new Set(sec.themes.flatMap((t) => t.subsections));
              const sectionLessons = allLessonStates.filter((ls) => {
                const code = subsectionCode(ls.lesson.spec_reference);
                return !!code && subsetCodes.has(code);
              });
              if (sectionLessons.length === 0) return null;

              const completedCount = sectionLessons.filter((l) => l.completed).length;
              const pct = Math.round((completedCount / sectionLessons.length) * 100);
              const isOpen = openSectionCode === sec.code;

              return (
                <div key={sec.code} className="rounded-xl bg-[#1a2744] border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setOpenSectionCode(isOpen ? null : sec.code)}
                    className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="px-2 h-9 min-w-9 rounded-lg bg-emerald/10 text-emerald flex items-center justify-center font-display font-bold shrink-0 text-sm">
                      {sec.code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-white truncate">
                        Section {sec.code}: {sec.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {completedCount} / {sectionLessons.length} lessons complete
                      </p>
                      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden max-w-md">
                        <div
                          className="h-full bg-emerald transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="size-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="size-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/5">
                      {sec.themes.map((theme) => {
                        const themeLessons = sectionLessons.filter((ls) => {
                          const code = subsectionCode(ls.lesson.spec_reference);
                          return !!code && theme.subsections.includes(code);
                        });
                        return (
                          <ThemeGroup
                            key={theme.number}
                            theme={theme}
                            lessons={themeLessons}
                            onTestOut={(lesson) => setTestOutLesson(lesson)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {testOutLesson && (
        <TestOutDialog
          lesson={testOutLesson}
          onClose={() => setTestOutLesson(null)}
          onPassed={() => {
            setTestOutLesson(null);
            refresh();
          }}
        />
      )}
    </AppLayout>
  );
}

function ThemeGroup({
  theme,
  lessons,
  onTestOut,
}: {
  theme: AqaTheme;
  lessons: LessonState[];
  onTestOut: (lesson: Lesson) => void;
}) {
  const [open, setOpen] = useState(true);
  const subsections = groupLessonsBySubsection(lessons, theme.subsections);
  const completedCount = lessons.filter((l) => l.completed).length;
  const pct =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="border-t border-white/5 first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer"
      >
        <div className="size-7 rounded-md bg-emerald/15 text-emerald flex items-center justify-center font-display font-bold text-xs shrink-0">
          T{theme.number}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-display font-semibold text-white truncate">
            Theme {theme.number}: {theme.title}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {completedCount} / {lessons.length} lessons complete · {pct}%
          </p>
        </div>
        {open ? (
          <ChevronDown className="size-4 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-slate-500 shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-white/5">
          {subsections.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">No lessons in this theme yet.</div>
          ) : (
            subsections.map((sub) => (
              <SubsectionGroup
                key={sub.code}
                sub={sub}
                onTestOut={onTestOut}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}


function LessonRow({ state, onTestOut }: { state: LessonState; onTestOut: () => void }) {
  const { lesson, status, progressPercent, blockCount, hasQuestions } = state;

  const statusBadge = () => {
    if (status === "completed")
      return (
        <CheckCircle2 className="size-4 text-emerald shrink-0" aria-label="Completed" />
      );
    if (status === "in_progress")
      return <span className="text-gold text-xs font-medium">In progress</span>;
    return null;
  };

  const hasContent = blockCount > 0;

  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge()}
          <h4 className="font-display font-semibold text-white truncate">{lesson.title}</h4>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {lesson.estimated_minutes} min{lesson.spec_reference ? ` • ${lesson.spec_reference}` : ""}
          {!hasContent && " • content coming soon"}
        </p>
        {status === "in_progress" && (
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-xs">
            <div className="h-full bg-emerald transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {hasContent && status !== "locked" && (
          <Button asChild className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold">
            <Link to="/course/$lessonId" params={{ lessonId: lesson.slug }}>
              {status === "completed" ? (
                <>
                  <RotateCcw className="size-4" /> Review
                </>
              ) : status === "in_progress" ? (
                <>
                  <PlayCircle className="size-4" /> Continue
                </>
              ) : (
                <>
                  <PlayCircle className="size-4" /> Start
                </>
              )}
            </Link>
          </Button>
        )}
        {hasContent && hasQuestions && status === "available" && (
          <Button
            variant="outline"
            onClick={onTestOut}
            className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold"
          >
            <Sparkles className="size-4" /> Test out
          </Button>
        )}
        {status === "locked" && (
          <Link
            to="/account"
            title="Upgrade to unlock"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-gold"
          >
            <Lock className="size-3.5" /> Upgrade to unlock
          </Link>
        )}
      </div>
    </div>
  );
}


type TestQ = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation: string;
};

const PASS_THRESHOLD = 75;

function TestOutDialog({
  lesson,
  onClose,
  onPassed,
}: {
  lesson: Lesson;
  onClose: () => void;
  onPassed: () => void;
}) {
  const [questions, setQuestions] = useState<TestQ[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("quiz_questions")
        .select("id,question_text,option_a,option_b,option_c,option_d,correct_option,explanation")
        .eq("lesson_id", lesson.id)
        .order("sort_order");
      setQuestions((data ?? []) as TestQ[]);
    })();
  }, [lesson.id]);

  const submit = async () => {
    if (!questions || submitting) return;
    if (Object.keys(answers).length < questions.length) {
      toast.error("Answer every question before submitting.");
      return;
    }
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user!.id;
    let score = 0;
    const attempts = questions.map((q) => {
      const sel = answers[q.id];
      const ok = sel === q.correct_option;
      if (ok) score++;
      return {
        user_id: userId,
        question_id: q.id,
        lesson_id: lesson.id,
        selected_option: sel,
        is_correct: ok,
        context: "test_out" as const,
      };
    });
    const percent = Math.round((score / questions.length) * 100);
    const passed = percent >= PASS_THRESHOLD;

    await supabase.from("quiz_attempts").insert(attempts);
    await supabase.from("test_out_attempts").insert({
      user_id: userId,
      lesson_id: lesson.id,
      score,
      total: questions.length,
      passed,
    });

    if (passed) {
      await supabase
        .from("lesson_completions")
        .upsert(
          {
            user_id: userId,
            lesson_id: lesson.id,
            score_percent: percent,
            via_test_out: true,
          },
          { onConflict: "user_id,lesson_id" },
        );
      // Add to review queue with one-day initial interval.
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const next = tomorrow.toISOString().slice(0, 10);
      await supabase.from("review_queue").upsert(
        questions.map((q) => ({
          user_id: userId,
          question_id: q.id,
          correct_streak: answers[q.id] === q.correct_option ? 1 : 0,
          next_review_date: next,
          is_mastered: false,
        })),
        { onConflict: "user_id,question_id" },
      );
    }

    setResult({ score, total: questions.length, passed });
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          if (result?.passed) onPassed();
          else onClose();
        }
      }}
    >
      <DialogContent className="dark bg-[#1a2744] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-white">
            Test out: {lesson.title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Score {PASS_THRESHOLD}% or higher to skip this lesson. You can still review later.
          </DialogDescription>
        </DialogHeader>

        {!questions ? (
          <div className="py-8 text-center text-slate-400">Loading questions…</div>
        ) : result ? (
          <div className="py-4 space-y-3 text-center">
            <div className={`text-4xl font-display font-bold ${result.passed ? "text-emerald" : "text-incorrect"}`}>
              {Math.round((result.score / result.total) * 100)}%
            </div>
            <p className="text-slate-300">
              {result.score} / {result.total} correct
            </p>
            <p className={result.passed ? "text-emerald font-medium" : "text-slate-400"}>
              {result.passed
                ? "Nice — lesson marked complete. Questions added to your review queue."
                : `You need ${PASS_THRESHOLD}% to test out. Work through the lesson and try again.`}
            </p>
            <div className="pt-2">
              <Button
                onClick={() => (result.passed ? onPassed() : onClose())}
                className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <p className="font-medium text-white">
                    {i + 1}. {q.question_text}
                  </p>
                  <div className="grid gap-2">
                    {(["A", "B", "C", "D"] as const).map((opt) => {
                      const text = q[`option_${opt.toLowerCase()}` as "option_a"];
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                            selected
                              ? "border-emerald bg-emerald/10 text-white"
                              : "border-white/10 hover:border-white/20 text-slate-300"
                          }`}
                        >
                          <span className="font-semibold mr-2">{opt}.</span>
                          {text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={submitting}
                className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold"
              >
                {submitting ? "Submitting…" : "Submit answers"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
