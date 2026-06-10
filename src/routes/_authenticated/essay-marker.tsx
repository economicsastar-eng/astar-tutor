import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { markEssay, getEssayUsage, type EssayFeedback } from "@/lib/essay.functions";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/essay-marker")({
  head: () => ({ meta: [{ title: "Essay Marker — EconAStar" }] }),
  component: EssayMarkerPage,
});

const QUESTION_TYPES = [
  { label: "4-mark Explain", marks: 4 },
  { label: "8-mark Explain", marks: 8 },
  { label: "15-mark Discuss", marks: 15 },
  { label: "25-mark Evaluate", marks: 25 },
  { label: "Other", marks: 0 },
];

const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC"];

function Ring({ mark, max }: { mark: number; max: number }) {
  const pct = max > 0 ? Math.min(1, mark / max) : 0;
  const color = pct >= 0.7 ? "#10b981" : pct >= 0.5 ? "#f59e0b" : "#ef4444";
  const r = 60;
  const c = 2 * Math.PI * r;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
      <circle cx="80" cy="80" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
      <circle
        cx="80"
        cy="80"
        r={r}
        stroke={color}
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: "stroke-dashoffset 600ms ease" }}
      />
      <text
        x="80"
        y="80"
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90"
        transform="rotate(90 80 80)"
        fill="white"
        fontSize="28"
        fontWeight="700"
      >
        {mark}/{max}
      </text>
    </svg>
  );
}

function EssayMarkerPage() {
  const mark = useServerFn(markEssay);
  const usageFn = useServerFn(getEssayUsage);

  const [examBoard, setExamBoard] = useState("AQA");
  const [questionType, setQuestionType] = useState("25-mark Evaluate");
  const [markAllocation, setMarkAllocation] = useState(25);
  const [question, setQuestion] = useState("");
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState<number | null>(1);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("exam_board,plan")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p?.exam_board && EXAM_BOARDS.includes(p.exam_board)) setExamBoard(p.exam_board);
      if (p?.plan) setPlan(p.plan);
      const usage = await usageFn();
      setPlan(usage.plan);
      setUsed(usage.used);
      setLimit(usage.limit);
    })();
  }, [usageFn]);

  const onQuestionTypeChange = (v: string) => {
    setQuestionType(v);
    const t = QUESTION_TYPES.find((q) => q.label === v);
    if (t && t.marks > 0) setMarkAllocation(t.marks);
  };

  const canSubmit = question.trim() && essay.trim() && !loading;
  const isFree = plan === "free";
  const isMonthly = plan === "monthly";
  const isUnlimited = plan === "until_2027" || plan === "until_2028";
  const freeExhausted = isFree && used >= 1;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setFeedback(null);
    setErrorMsg(null);
    try {
      const res = await mark({
        data: {
          questionText: question,
          examBoard,
          questionType,
          markAllocation,
          essayText: essay,
        },
      });
      if (!res.ok) {
        setErrorMsg(res.error || "Unknown error from marking service.");
        toast.error(res.error);
        return;
      }
      setFeedback(res.feedback);
      const usage = await usageFn();
      setUsed(usage.used);
      setLimit(usage.limit);
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      setErrorMsg(msg);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFeedback(null);
    setQuestion("");
    setEssay("");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const remaining = useMemo(() => Math.max(0, (limit ?? 0) - used), [limit, used]);

  return (
    <AppLayout title="Essay Marker">
      <div ref={topRef} className="space-y-6">
        <div className="rounded-xl bg-[#1a2744] border border-white/5 p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Exam board</Label>
              <Select value={examBoard} onValueChange={setExamBoard}>
                <SelectTrigger className="bg-[#0f1c2e] border-white/10 text-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_BOARDS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Question type</Label>
              <Select value={questionType} onValueChange={onQuestionTypeChange}>
                <SelectTrigger className="bg-[#0f1c2e] border-white/10 text-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((q) => (
                    <SelectItem key={q.label} value={q.label}>{q.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Mark allocation</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={markAllocation}
                onChange={(e) => setMarkAllocation(parseInt(e.target.value || "0", 10) || 0)}
                className="bg-[#0f1c2e] border-white/10 text-white h-11 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Question</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type or paste the exam question here"
              className="min-h-[88px] bg-[#0f1c2e] border-white/10 text-white resize-y text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Your essay</Label>
            <Textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Type or paste your essay answer here"
              className="min-h-[240px] bg-[#0f1c2e] border-white/10 text-white resize-y text-base leading-relaxed"
            />
            <p className="text-xs text-slate-400">
              Tip: If you drew a diagram, describe it in words (e.g. "I drew an AD/AS diagram showing AD shifting right").
            </p>
          </div>

          {freeExhausted && (
            <div className="rounded-lg bg-gold/10 border border-gold/30 p-4 text-center space-y-3">
              <p className="text-sm text-gold">
                You've used your 1 free essay mark. Upgrade for unlimited essay marking.
              </p>
              <Button asChild className="bg-gold text-[#0f1c2e] hover:bg-gold/90 font-semibold">
                <Link to="/account">Upgrade</Link>
              </Button>
            </div>
          )}

          {isFree && !freeExhausted && (
            <p className="text-sm text-slate-300 text-center">
              <span className="font-semibold text-white">1 free essay mark</span> — see exactly what an A-Level Economics tutor would say about your answer.
            </p>
          )}

          {isMonthly && (
            <p className="text-sm text-slate-300 text-center">
              <span className="font-semibold text-white">{remaining}/10</span> essay marks remaining this month
            </p>
          )}

          {isUnlimited && (
            <p className="text-sm text-emerald text-center">Unlimited essay marking ✓</p>
          )}

          {!freeExhausted && (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-emerald hover:bg-emerald-hover text-white font-semibold h-12 text-base"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Marking your essay
                  <Dots />
                </span>
              ) : (
                "Mark My Essay"
              )}
            </Button>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 whitespace-pre-wrap break-words">
              <p className="font-semibold mb-1">Marking failed</p>
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {loading && !feedback && (
          <div className="rounded-xl border-2 border-emerald/40 bg-[#1a2744]/40 p-10 text-center animate-pulse">
            <p className="text-slate-300">Reading your essay like a tutor would…</p>
          </div>
        )}

        {feedback && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#1a2744] border border-white/5 p-6 flex flex-col items-center text-center gap-3">
              <Ring mark={feedback.mark} max={feedback.maxMark} />
              <p className="text-3xl sm:text-4xl font-display font-bold text-white">
                {feedback.mark} / {feedback.maxMark}
              </p>
              <p className="text-base font-semibold text-slate-200">{feedback.levelDescriptor}</p>
              {feedback.whyNotOneLevelHigher && (
                <p className="text-sm text-slate-300 max-w-xl italic">
                  Why not one level higher: {feedback.whyNotOneLevelHigher}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-[#1a2744] border border-white/5 border-l-4 border-l-emerald p-6">
              <h3 className="font-display font-bold text-white text-lg mb-3">What you did well</h3>
              <ul className="space-y-2 list-disc pl-5 text-slate-200">
                {feedback.whatYouDidWell.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div className="rounded-xl bg-[#1a2744] border border-white/5 border-l-4 border-l-gold p-6">
              <h3 className="font-display font-bold text-white text-lg mb-3">What's missing</h3>
              <ul className="space-y-2 list-disc pl-5 text-slate-200">
                {feedback.whatsMissing.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            {feedback.paragraphTransformation && (
              <div className="rounded-xl bg-[#1a2744] border border-white/5 border-t-4 border-t-gold p-6 space-y-4">
                <h3 className="font-display font-bold text-white text-lg">Your weakest paragraph, rewritten to A*</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[#0f1c2e] border border-white/10 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Your version</p>
                    <p className="text-slate-200 italic leading-relaxed text-sm">{feedback.paragraphTransformation.original}</p>
                  </div>
                  <div className="rounded-lg bg-emerald/5 border border-emerald/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-emerald font-semibold mb-2">A* version</p>
                    <p className="text-slate-100 leading-relaxed text-sm">{feedback.paragraphTransformation.improved}</p>
                  </div>
                </div>
              </div>
            )}

            {feedback.threeActionsBeforeNext && feedback.threeActionsBeforeNext.length > 0 && (
              <div className="rounded-xl border border-emerald/30 bg-emerald/10 p-6">
                <h3 className="font-display font-bold text-white text-lg mb-3">Do these 3 things before your next essay</h3>
                <ol className="space-y-3 list-decimal pl-5 text-white marker:text-emerald marker:font-bold">
                  {feedback.threeActionsBeforeNext.slice(0, 3).map((s, i) => (
                    <li key={i} className="pl-1 leading-relaxed">{s}</li>
                  ))}
                </ol>
              </div>
            )}

            <Button
              variant="outline"
              onClick={reset}
              className="w-full border-white/20 text-white bg-transparent hover:bg-white/5 h-11"
            >
              <RefreshCw className="size-4 mr-2" />
              Mark another essay
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Dots() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x % 3) + 1), 400);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-6 text-left">{".".repeat(n)}</span>;
}
