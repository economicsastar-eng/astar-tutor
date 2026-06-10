import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get started — EconAStar" }] }),
  component: OnboardingPage,
});

const TARGET_GRADES = ["A*", "A", "B", "Just passing"];
const WEEKLY_HOURS = [
  { value: "under_1", label: "Under 1 hour", target: 1 },
  { value: "1_to_2", label: "1–2 hours", target: 2 },
  { value: "3_plus", label: "3+ hours", target: 3 },
];

const STEPS = ["Exams", "Target", "Time"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [targetGrade, setTargetGrade] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [summary, setSummary] = useState<{ daysToExam: number | null; dailyTarget: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/login", replace: true });
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("onboarding_completed,exam_date,target_grade,weekly_hours")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      if (p?.exam_date) setExamDate(String(p.exam_date));
      if (p?.target_grade) setTargetGrade(p.target_grade);
      if (p?.weekly_hours) setWeeklyHours(p.weekly_hours);
      setLoaded(true);
    })();
  }, [navigate]);

  const canContinue = () => {
    if (step === 0) return true; // exam date can be skipped
    if (step === 1) return !!targetGrade;
    if (step === 2) return !!weeklyHours;
    return false;
  };

  const finish = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const wh = WEEKLY_HOURS.find((w) => w.value === weeklyHours);
    const dailyTarget = wh?.target ?? 2;

    await supabase
      .from("profiles")
      .update({
        exam_date: examDate || undefined,
        target_grade: targetGrade || null,
        weekly_hours: weeklyHours || null,
        daily_target: dailyTarget,
        onboarding_completed: true,
      })
      .eq("id", u.user.id);

    const daysToExam = examDate
      ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;
    setSummary({ daysToExam, dailyTarget });
    setSaving(false);
  };

  const onContinue = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    await finish();
  };

  if (!loaded) return null;

  if (summary) {
    return (
      <div className="dark min-h-screen flex flex-col bg-[#0f1c2e] text-foreground px-4 py-10">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xl text-center space-y-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">You're set up.</h1>
            <p className="text-lg text-slate-200 leading-relaxed">
              Based on your answers, we suggest completing{" "}
              <span className="font-semibold text-emerald">{summary.dailyTarget} lesson{summary.dailyTarget === 1 ? "" : "s"} per day</span>.{" "}
              {summary.daysToExam !== null && (
                <>You have <span className="font-semibold text-gold">{summary.daysToExam} days</span> until your exam.</>
              )}{" "}
              Let's start.
            </p>
            <Button
              onClick={() => navigate({ to: "/course", replace: true })}
              className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold px-8 h-12 text-base"
            >
              Start your first lesson <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen flex flex-col bg-[#0f1c2e] text-foreground px-4 py-10">
      <div className="flex items-center justify-center gap-2 mb-12">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "bg-emerald w-8" : i < step ? "bg-emerald/60 w-2" : "bg-white/15 w-2"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {step === 0 && (
            <Step title="When are your exams?" subtitle="We'll show a countdown so you always know how long you have. You can skip if you don't know yet.">
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="bg-[#1a2744] border-white/10 text-white h-12 text-base max-w-xs mx-auto"
              />
            </Step>
          )}
          {step === 1 && (
            <Step title="What grade are you aiming for?">
              <CardGrid options={TARGET_GRADES} selected={targetGrade} onSelect={setTargetGrade} cols={2} />
            </Step>
          )}
          {step === 2 && (
            <Step title="How much time can you spend on Economics each week?">
              <CardGrid
                options={WEEKLY_HOURS.map((w) => w.label)}
                selected={WEEKLY_HOURS.find((w) => w.value === weeklyHours)?.label ?? ""}
                onSelect={(label) => {
                  const found = WEEKLY_HOURS.find((w) => w.label === label);
                  if (found) setWeeklyHours(found.value);
                }}
                cols={1}
              />
            </Step>
          )}

          <div className="flex justify-center gap-3 mt-10">
            {step === 0 && (
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white"
              >
                Skip
              </Button>
            )}
            <Button
              onClick={onContinue}
              disabled={!canContinue() || saving}
              className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold px-8 h-11"
            >
              {saving ? "Saving…" : step === STEPS.length - 1 ? "Finish" : "Continue"}
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3 text-center">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 max-w-md mx-auto">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function CardGrid({
  options,
  selected,
  onSelect,
  cols,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  cols: 1 | 2 | 3;
}) {
  const gridCls = cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3";
  return (
    <div className={`grid ${gridCls} gap-3`}>
      {options.map((o) => {
        const active = selected === o;
        return (
          <button
            key={o}
            onClick={() => onSelect(o)}
            className={`rounded-xl border p-5 text-left font-semibold transition-all cursor-pointer ${
              active
                ? "border-emerald bg-emerald/15 text-white"
                : "border-white/10 bg-[#1a2744] text-slate-200 hover:border-white/30"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
