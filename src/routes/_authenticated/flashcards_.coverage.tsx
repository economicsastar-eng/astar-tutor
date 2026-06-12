import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";
import { ArrowLeft, CheckCircle2, AlertCircle, Circle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/flashcards_/coverage")({
  head: () => ({ meta: [{ title: "Spec Coverage — EconAStar" }] }),
  component: CoveragePage,
});

// Per-subtopic target card counts (tuned to spec scope/depth).
// Adjust here as the deck grows.
type Subtopic = { spec: string; name: string; target: number };
type Section = { number: 1 | 2; code: string; title: string; subtopics: Subtopic[] };

const SECTIONS: Section[] = [
  {
    number: 1,
    code: "3.1",
    title: "Individuals, firms, markets and market failure",
    subtopics: [
      { spec: "3.1.1", name: "Nature of economics", target: 8 },
      { spec: "3.1.2", name: "Individual economic decision making", target: 10 },
      { spec: "3.1.3", name: "Price determination in a competitive market", target: 14 },
      { spec: "3.1.4", name: "Production, costs and revenue", target: 14 },
      { spec: "3.1.5", name: "Perfect competition, imperfectly competitive markets and monopoly", target: 18 },
      { spec: "3.1.6", name: "The labour market", target: 12 },
      { spec: "3.1.7", name: "Distribution of income and wealth: poverty and inequality", target: 10 },
      { spec: "3.1.8", name: "Market mechanism, market failure and government intervention", target: 18 },
    ],
  },
  {
    number: 2,
    code: "3.2",
    title: "The national and international economy",
    subtopics: [
      { spec: "3.2.1", name: "The measurement of macroeconomic performance", target: 10 },
      { spec: "3.2.2", name: "How the macroeconomy works: AD/AS analysis", target: 12 },
      { spec: "3.2.3", name: "Economic performance", target: 16 },
      { spec: "3.2.4", name: "Financial markets and monetary policy", target: 14 },
      { spec: "3.2.5", name: "Fiscal policy and supply-side policies", target: 12 },
      { spec: "3.2.6", name: "The international economy", target: 16 },
    ],
  },
];

type Status = "empty" | "sparse" | "partial" | "covered";

function classify(count: number, target: number): Status {
  if (count === 0) return "empty";
  const ratio = count / target;
  if (ratio < 0.4) return "sparse";
  if (ratio < 1) return "partial";
  return "covered";
}

const STATUS_META: Record<Status, { label: string; bar: string; pill: string; dot: string }> = {
  empty: {
    label: "Missing",
    bar: "bg-rose-500",
    pill: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-500",
  },
  sparse: {
    label: "Sparse",
    bar: "bg-amber-500",
    pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-500",
  },
  partial: {
    label: "Partial",
    bar: "bg-yellow-400",
    pill: "bg-yellow-400/15 text-yellow-200 border-yellow-400/30",
    dot: "bg-yellow-400",
  },
  covered: {
    label: "Covered",
    bar: "bg-emerald",
    pill: "bg-emerald/15 text-emerald border-emerald/30",
    dot: "bg-emerald",
  },
};

function CoveragePage() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("flashcards").select("spec_ref");
      const map = new Map<string, number>();
      for (const row of (data ?? []) as { spec_ref: string }[]) {
        map.set(row.spec_ref, (map.get(row.spec_ref) ?? 0) + 1);
      }
      setCounts(map);
      setLoading(false);
    })();
  }, []);

  const overall = useMemo(() => {
    let total = 0;
    let target = 0;
    const byStatus: Record<Status, number> = { empty: 0, sparse: 0, partial: 0, covered: 0 };
    for (const section of SECTIONS) {
      for (const sub of section.subtopics) {
        const c = counts.get(sub.spec) ?? 0;
        total += c;
        target += sub.target;
        byStatus[classify(c, sub.target)] += 1;
      }
    }
    const subtopicCount = SECTIONS.reduce((n, s) => n + s.subtopics.length, 0);
    return { total, target, byStatus, subtopicCount };
  }, [counts]);

  if (loading) {
    return (
      <AppLayout title="Spec coverage">
        <div className="text-slate-400 text-sm">Loading coverage…</div>
      </AppLayout>
    );
  }

  const pct = Math.min(100, Math.round((overall.total / overall.target) * 100));

  return (
    <AppLayout title="Spec coverage">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/flashcards"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Back to deck
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-display font-bold text-white">Spec coverage</h2>
          <p className="text-sm text-slate-400 mt-1">
            How completely each AQA subsection is covered by the flashcard deck.
          </p>
        </div>

        {/* Overall progress */}
        <div className="rounded-xl bg-[#1a2744] border border-white/5 p-5 space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Overall</div>
              <div className="text-3xl font-display font-bold text-white mt-1">
                {overall.total}{" "}
                <span className="text-slate-500 text-xl font-normal">/ {overall.target} cards</span>
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-emerald">{pct}%</div>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-emerald transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
            <SummaryChip
              icon={<CheckCircle2 className="size-4" />}
              label="Covered"
              value={overall.byStatus.covered}
              total={overall.subtopicCount}
              status="covered"
            />
            <SummaryChip
              icon={<Circle className="size-4" />}
              label="Partial"
              value={overall.byStatus.partial}
              total={overall.subtopicCount}
              status="partial"
            />
            <SummaryChip
              icon={<AlertCircle className="size-4" />}
              label="Sparse"
              value={overall.byStatus.sparse}
              total={overall.subtopicCount}
              status="sparse"
            />
            <SummaryChip
              icon={<AlertCircle className="size-4" />}
              label="Missing"
              value={overall.byStatus.empty}
              total={overall.subtopicCount}
              status="empty"
            />
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const sectionCount = section.subtopics.reduce(
            (n, s) => n + (counts.get(s.spec) ?? 0),
            0,
          );
          const sectionTarget = section.subtopics.reduce((n, s) => n + s.target, 0);
          const sectionPct = Math.min(100, Math.round((sectionCount / sectionTarget) * 100));
          return (
            <div
              key={section.number}
              className="rounded-xl bg-[#1a2744] border border-white/5 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-500/15 text-blue-300 border-blue-500/30">
                  Section {section.code}
                </span>
                <span className="flex-1 min-w-0 font-display font-semibold text-white truncate">
                  {section.title}
                </span>
                <span className="text-sm text-slate-300 tabular-nums">
                  {sectionCount} / {sectionTarget}
                </span>
                <span className="text-sm font-semibold text-emerald tabular-nums w-12 text-right">
                  {sectionPct}%
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {section.subtopics.map((sub) => {
                  const count = counts.get(sub.spec) ?? 0;
                  const status = classify(count, sub.target);
                  const meta = STATUS_META[status];
                  const subPct = Math.min(100, Math.round((count / sub.target) * 100));
                  return (
                    <div key={sub.spec} className="px-5 py-3.5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`size-2 rounded-full ${meta.dot} shrink-0`} />
                        <span className="text-xs font-mono text-slate-400 w-14 shrink-0">
                          {sub.spec}
                        </span>
                        <span className="flex-1 min-w-0 text-sm text-white truncate">
                          {sub.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.pill} shrink-0`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-400 tabular-nums w-16 text-right shrink-0">
                          {count} / {sub.target}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden ml-5">
                        <div
                          className={`h-full ${meta.bar} transition-all`}
                          style={{ width: `${subPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-slate-500">
          Targets are per-subtopic baselines based on spec scope. A subtopic counts as
          “Covered” once the deck reaches its target.
        </p>
      </div>
    </AppLayout>
  );
}

function SummaryChip({
  icon,
  label,
  value,
  total,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  status: Status;
}) {
  const meta = STATUS_META[status];
  return (
    <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${meta.pill}`}>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
        <div className="text-sm font-semibold tabular-nums">
          {value}
          <span className="opacity-60"> / {total}</span>
        </div>
      </div>
    </div>
  );
}
