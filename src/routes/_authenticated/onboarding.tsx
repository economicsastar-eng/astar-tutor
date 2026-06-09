import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get started — EconAStar" }] }),
  component: OnboardingPage,
});

const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC"];
const YEAR_GROUPS = ["Year 12", "Year 13", "Retaking", "Other"];
const TARGET_GRADES = ["A*", "A", "B", "C", "Just want to pass"];
const CONFIDENCE = [
  "Starting from scratch (I barely know anything)",
  "Got the basics but big gaps",
  "Know most of it, need to sharpen up",
  "Already confident, just need exam practice",
];

const STEPS = ["Exam board", "Year", "Target grade", "Confidence"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [examBoard, setExamBoard] = useState("AQA");
  const [yearGroup, setYearGroup] = useState("Year 13");
  const [targetGrade, setTargetGrade] = useState("A*");
  const [confidence, setConfidence] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("exam_board,year_group,target_grade,onboarding_completed")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      if (p) {
        if (p.exam_board) {
          const norm = ["AQA", "Edexcel", "OCR", "WJEC"].find((b) => p.exam_board.includes(b));
          if (norm) setExamBoard(norm);
        }
        if (p.year_group) setYearGroup(p.year_group);
        if (p.target_grade) setTargetGrade(p.target_grade);
      }
      setLoaded(true);
    })();
  }, [navigate]);

  const canContinue = () => {
    if (step === 0) return !!examBoard;
    if (step === 1) return !!yearGroup;
    if (step === 2) return !!targetGrade;
    if (step === 3) return !!confidence;
    return false;
  };

  const onContinue = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        exam_board: examBoard,
        year_group: yearGroup,
        target_grade: targetGrade,
        confidence_level: confidence,
        onboarding_completed: true,
      })
      .eq("id", u.user.id);
    setSaving(false);
    if (error) return;
    navigate({ to: "/dashboard", replace: true });
  };

  if (!loaded) return null;

  return (
    <div className="dark min-h-screen flex flex-col bg-[#0f1c2e] text-foreground px-4 py-10">
      {/* Progress dots */}
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
            <Step title="Which exam board are you studying?">
              <CardGrid
                options={EXAM_BOARDS}
                selected={examBoard}
                onSelect={setExamBoard}
                cols={2}
              />
            </Step>
          )}
          {step === 1 && (
            <Step title="What year are you in?">
              <CardGrid options={YEAR_GROUPS} selected={yearGroup} onSelect={setYearGroup} cols={2} />
            </Step>
          )}
          {step === 2 && (
            <Step title="What grade are you aiming for?">
              <CardGrid options={TARGET_GRADES} selected={targetGrade} onSelect={setTargetGrade} cols={3} />
            </Step>
          )}
          {step === 3 && (
            <Step title="How do you feel about Economics right now?">
              <CardGrid options={CONFIDENCE} selected={confidence} onSelect={setConfidence} cols={1} />
            </Step>
          )}

          <div className="flex justify-center mt-10">
            <Button
              onClick={onContinue}
              disabled={!canContinue() || saving}
              className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold px-8 h-11"
            >
              {saving ? "Saving…" : step === STEPS.length - 1 ? "Finish" : "Continue"}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-white text-center">{title}</h1>
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
