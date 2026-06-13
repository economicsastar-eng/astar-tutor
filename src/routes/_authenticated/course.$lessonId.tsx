import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/app/Markdown";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/course/$lessonId")({
  head: () => ({ meta: [{ title: "Lesson — EconAStar" }] }),
  component: LessonPlayer,
});

type Lesson = {
  id: string;
  title: string;
  slug: string;
  section_id: string;
  themeNumber?: number;
};
type Block = {
  id: string;
  block_type: "content" | "question" | "summary";
  sort_order: number;
  content_markdown: string | null;
  summary_points: string[] | null;
  key_terms: { term: string; definition: string }[] | null;
};
type Question = {
  id: string;
  lesson_block_id: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation: string;
};

function LessonPlayer() {
  const { lessonId } = useParams({ from: "/_authenticated/course/$lessonId" });
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [locked, setLocked] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState<{ score: number; total: number } | null>(null);

  // Per-question state for the active question block.
  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Track answers given during this session for final score.
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const uid = u.user.id;
      setUserId(uid);

      const { data: les } = await supabase
        .from("lessons")
        .select("id,title,slug,section_id,sections(theme_number)")
        .eq("slug", lessonId)
        .maybeSingle();
      if (!les) {
        if (!cancel) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      const themeNumber = (les as { sections?: { theme_number?: number } }).sections?.theme_number ?? 1;

      // Paywall: free plan only gets Theme 1
      const { data: prof } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", uid)
        .maybeSingle();
      const plan = prof?.plan ?? "free";
      if (plan === "free" && themeNumber > 1) {
        if (!cancel) {
          setLesson({ ...(les as Lesson), themeNumber });
          setLocked(true);
          setLoading(false);
        }
        return;
      }

      const [{ data: bls }, { data: qs }, { data: prog }, { data: attempts }, { data: done }] =
        await Promise.all([
          supabase
            .from("lesson_blocks")
            .select("id,block_type,sort_order,content_markdown,summary_points,key_terms")
            .eq("lesson_id", les.id)
            .order("sort_order"),
          supabase
            .from("quiz_questions")
            .select(
              "id,lesson_block_id,question_text,option_a,option_b,option_c,option_d,correct_option,explanation",
            )
            .eq("lesson_id", les.id),
          supabase
            .from("lesson_progress")
            .select("current_block_order")
            .eq("user_id", uid)
            .eq("lesson_id", les.id)
            .maybeSingle(),
          supabase
            .from("quiz_attempts")
            .select("question_id,is_correct,attempted_at")
            .eq("user_id", uid)
            .eq("lesson_id", les.id)
            .order("attempted_at", { ascending: true }),
          supabase
            .from("lesson_completions")
            .select("score_percent")
            .eq("user_id", uid)
            .eq("lesson_id", les.id)
            .maybeSingle(),
        ]);

      if (cancel) return;
      setLesson(les as Lesson);
      const blocksList = (bls ?? []) as Block[];
      setBlocks(blocksList);
      setQuestions((qs ?? []) as Question[]);

      // Seed prior answers (latest attempt per question wins) so completion scoring
      // reflects everything the learner has done across sessions.
      const prior: Record<string, boolean> = {};
      for (const a of (attempts ?? []) as { question_id: string; is_correct: boolean }[]) {
        prior[a.question_id] = a.is_correct;
      }
      setSessionAnswers(prior);

      // If they previously finished, drop them at the start; otherwise resume in place.
      const savedIndex = prog?.current_block_order ?? 0;
      const lastIndex = Math.max(0, blocksList.length - 1);
      const resumeAt = done ? 0 : Math.min(savedIndex, lastIndex);
      setCurrentIndex(Math.max(0, resumeAt));
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [lessonId]);

  const currentBlock = blocks[currentIndex];
  const activeQuestion = useMemo(() => {
    if (!currentBlock || currentBlock.block_type !== "question") return null;
    return questions.find((q) => q.lesson_block_id === currentBlock.id) ?? null;
  }, [currentBlock, questions]);

  // Reset question UI when navigating to a new block.
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [currentBlock?.id]);

  const persistProgress = async (nextIndex: number) => {
    if (!userId || !lesson) return;
    await supabase.from("lesson_progress").upsert(
      { user_id: userId, lesson_id: lesson.id, current_block_order: nextIndex },
      { onConflict: "user_id,lesson_id" },
    );
  };

  const handleSubmitAnswer = async () => {
    if (!activeQuestion || !selected || !userId || !lesson) return;
    setSubmitted(true);
    const isCorrect = selected === activeQuestion.correct_option;
    setSessionAnswers((prev) =>
      prev[activeQuestion.id] === undefined ? { ...prev, [activeQuestion.id]: isCorrect } : prev,
    );
    await supabase.from("quiz_attempts").insert({
      user_id: userId,
      question_id: activeQuestion.id,
      lesson_id: lesson.id,
      selected_option: selected,
      is_correct: isCorrect,
      context: "lesson",
    });
  };

  const handleNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= blocks.length) {
      await handleComplete();
      return;
    }
    setCurrentIndex(nextIndex);
    await persistProgress(nextIndex);
  };

  const handlePrev = async () => {
    if (currentIndex === 0) return;
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    await persistProgress(prev);
  };

  const handleComplete = async () => {
    if (!userId || !lesson || completing) return;
    setCompleting(true);
    const total = questions.length;
    const correct = Object.values(sessionAnswers).filter(Boolean).length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 100;

    await supabase
      .from("lesson_completions")
      .upsert(
        {
          user_id: userId,
          lesson_id: lesson.id,
          score_percent: percent,
          via_test_out: false,
        },
        { onConflict: "user_id,lesson_id" },
      );

    if (questions.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const next = tomorrow.toISOString().slice(0, 10);
      await supabase.from("review_queue").upsert(
        questions.map((q) => ({
          user_id: userId,
          question_id: q.id,
          correct_streak: sessionAnswers[q.id] ? 1 : 0,
          next_review_date: next,
          is_mastered: false,
        })),
        { onConflict: "user_id,question_id" },
      );
    }

    // Move progress past the end so resume opens the next lesson cleanly.
    await persistProgress(blocks.length);
    setCompleted({ score: correct, total });
    setCompleting(false);
    toast.success("Lesson complete!");
  };

  if (loading) {
    return (
      <AppLayout title="Lesson">
        <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center text-slate-400">
          Loading lesson…
        </div>
      </AppLayout>
    );
  }

  if (locked && lesson) {
    return (
      <AppLayout title={lesson.title}>
        <div className="max-w-xl mx-auto rounded-xl bg-[#1a2744] border border-gold/30 p-8 text-center space-y-4">
          <div className="size-14 mx-auto rounded-full bg-gold/15 flex items-center justify-center">
            <Trophy className="size-7 text-gold" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">This lesson is in Theme {lesson.themeNumber}</h2>
          <p className="text-slate-300">
            Free access covers Theme 1. Upgrade to unlock all 96 lessons across Themes 1–4, unlimited essay marking, and unlimited tutor messages.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className="bg-gold text-[#0f1c2e] hover:bg-gold/90 font-semibold">
              <Link to="/account">Upgrade to access</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/5">
              <Link to="/course">Back to course</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (notFound || !lesson) {
    return (
      <AppLayout title="Lesson">
        <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center">
          <p className="text-white font-display font-semibold mb-2">Lesson not found</p>
          <p className="text-slate-400 text-sm mb-4">It may have moved or been removed.</p>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/5">
            <Link to="/course">Back to course</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (blocks.length === 0) {
    return (
      <AppLayout title={lesson.title}>
        <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center">
          <p className="text-white font-display font-semibold mb-2">No content yet</p>
          <p className="text-slate-400 text-sm mb-4">This lesson is being prepared.</p>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/5">
            <Link to="/course">Back to course</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (completed) {
    const pct = completed.total > 0 ? Math.round((completed.score / completed.total) * 100) : 100;
    return (
      <AppLayout title={lesson.title}>
        <div className="max-w-2xl mx-auto rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center space-y-4">
          <div className="size-16 mx-auto rounded-full bg-emerald/10 flex items-center justify-center">
            <Trophy className="size-8 text-gold" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">Lesson complete!</h2>
          {completed.total > 0 ? (
            <p className="text-slate-300">
              You scored <span className="text-emerald font-semibold">{pct}%</span> ({completed.score}/
              {completed.total} correct). These questions will reappear in your review queue tomorrow.
            </p>
          ) : (
            <p className="text-slate-300">Nice work. Onwards.</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold">
              <Link to="/course">Back to course</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/5">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / blocks.length) * 100);
  const isLast = currentIndex === blocks.length - 1;

  return (
    <AppLayout title={lesson.title}>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/course"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Course
          </Link>
          <span className="text-xs text-slate-400">
            {currentIndex + 1} / {blocks.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-emerald transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Block */}
        <div className="rounded-xl bg-[#1a2744] border border-white/5 p-5 sm:p-8">
          {currentBlock.block_type === "content" && (
            <ContentBlock block={currentBlock} />
          )}
          {currentBlock.block_type === "question" && activeQuestion && (
            <QuestionBlock
              question={activeQuestion}
              selected={selected}
              submitted={submitted}
              onSelect={(o) => !submitted && setSelected(o)}
              onSubmit={handleSubmitAnswer}
            />
          )}
          {currentBlock.block_type === "question" && !activeQuestion && (
            <div className="text-slate-400 text-sm">
              Question missing — skip to continue.
            </div>
          )}
          {currentBlock.block_type === "summary" && <SummaryBlock block={currentBlock} />}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {currentBlock.block_type === "question" && activeQuestion && !submitted ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selected}
              className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold"
            >
              Submit answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={completing}
              className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold"
            >
              {isLast ? (completing ? "Finishing…" : "Complete lesson") : (
                <>
                  Next <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ContentBlock({ block }: { block: Block }) {
  return (
    <div>
      {block.content_markdown && <Markdown source={block.content_markdown} />}
      {block.key_terms && block.key_terms.length > 0 && (
        <div className="mt-5 rounded-lg border border-emerald/30 bg-emerald/5 p-4">
          <p className="text-xs uppercase tracking-wider text-emerald font-semibold mb-2">
            Key terms
          </p>
          <dl className="space-y-2 text-sm">
            {block.key_terms.map((t, i) => (
              <div key={i}>
                <dt className="text-white font-semibold inline">{t.term}: </dt>
                <dd className="text-slate-300 inline">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function QuestionBlock({
  question,
  selected,
  submitted,
  onSelect,
  onSubmit,
}: {
  question: Question;
  selected: "A" | "B" | "C" | "D" | null;
  submitted: boolean;
  onSelect: (o: "A" | "B" | "C" | "D") => void;
  onSubmit: () => void;
}) {
  const isCorrect = selected === question.correct_option;
  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-wider text-emerald font-semibold">Check yourself</p>
      <h3 className="text-lg font-display font-semibold text-white">{question.question_text}</h3>
      <div className="grid gap-3">
        {(["A", "B", "C", "D"] as const).map((opt) => {
          const text = question[`option_${opt.toLowerCase()}` as "option_a"];
          const isSelected = selected === opt;
          const isCorrectAnswer = opt === question.correct_option;
          let className =
            "text-left px-4 py-4 rounded-lg border text-base transition-colors cursor-pointer min-h-[56px] ";
          if (submitted) {
            if (isCorrectAnswer)
              className += "border-emerald bg-emerald/10 text-white";
            else if (isSelected)
              className += "border-incorrect bg-incorrect/10 text-white";
            else className += "border-white/10 text-slate-400";
          } else {
            className += isSelected
              ? "border-emerald bg-emerald/10 text-white"
              : "border-white/10 hover:border-white/20 text-slate-300";
          }
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              disabled={submitted}
              className={className}
            >
              <span className="font-semibold mr-2">{opt}.</span>
              {text}
            </button>
          );
        })}
      </div>
      {submitted && (
        <div
          className={`rounded-lg p-4 border ${
            isCorrect
              ? "border-emerald/40 bg-emerald/5"
              : "border-incorrect/40 bg-incorrect/5"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {isCorrect ? (
              <>
                <CheckCircle2 className="size-4 text-emerald" />
                <span className="text-emerald font-semibold text-sm">Correct</span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-incorrect" />
                <span className="text-incorrect font-semibold text-sm">
                  Not quite — correct answer is {question.correct_option}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-line">{question.explanation}</p>
        </div>
      )}
      {!submitted && (
        <p className="text-xs text-slate-500">
          Select an answer, then press Submit.{" "}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!selected}
            className="text-emerald hover:underline disabled:text-slate-600 disabled:no-underline"
          >
            Submit
          </button>
        </p>
      )}
    </div>
  );
}

function parseKeyTerms(
  raw: Block["key_terms"] | null,
): { term: string; definition: string }[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((item) => {
      if (typeof item === "string") {
        const idx = item.indexOf(":");
        if (idx === -1) return { term: item.trim(), definition: "" };
        return {
          term: item.slice(0, idx).trim(),
          definition: item.slice(idx + 1).trim(),
        };
      }
      const obj = item as { term?: string; definition?: string };
      return { term: obj.term ?? "", definition: obj.definition ?? "" };
    })
    .filter((t) => t.term);
}

function SummaryBlock({ block }: { block: Block }) {
  const keyTerms = parseKeyTerms(block.key_terms);
  const points = block.summary_points ?? [];
  return (
    <div className="space-y-5">
      {block.content_markdown && <Markdown source={block.content_markdown} />}
      {points.length > 0 && (
        <div className="rounded-lg border border-emerald/30 bg-emerald/10 p-5">
          <h3 className="text-base font-display font-bold text-emerald mb-3">Summary</h3>
          <ul className="space-y-2 text-sm text-slate-100">
            {points.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald mt-0.5">•</span>
                <span className="whitespace-pre-line">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {keyTerms.length > 0 && (
        <div className="rounded-lg border border-sky-400/30 bg-sky-400/10 p-5">
          <h3 className="text-base font-display font-bold text-sky-300 mb-3">Key Terms</h3>
          <dl className="space-y-2 text-sm">
            {keyTerms.map((t, i) => (
              <div key={i}>
                <dt className="text-white font-semibold inline">{t.term}: </dt>
                <dd className="text-slate-200 inline">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
