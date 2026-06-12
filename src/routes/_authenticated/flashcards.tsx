import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Globe2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — EconAStar" }] }),
  component: FlashcardsPage,
});

// ---------- Spec structure ----------
type Subtopic = { spec: string; name: string };
type Section = { number: 1 | 2; code: string; title: string; subtopics: Subtopic[] };

const SECTIONS: Section[] = [
  {
    number: 1,
    code: "3.1",
    title: "Individuals, firms, markets and market failure",
    subtopics: [
      { spec: "3.1.1", name: "Nature of economics" },
      { spec: "3.1.2", name: "Individual economic decision making" },
      { spec: "3.1.3", name: "Price determination in a competitive market" },
      { spec: "3.1.4", name: "Production, costs and revenue" },
      { spec: "3.1.5", name: "Perfect competition, imperfectly competitive markets and monopoly" },
      { spec: "3.1.6", name: "The labour market" },
      { spec: "3.1.7", name: "The distribution of income and wealth: poverty and inequality" },
      { spec: "3.1.8", name: "The market mechanism, market failure and government intervention" },
    ],
  },
  {
    number: 2,
    code: "3.2",
    title: "The national and international economy",
    subtopics: [
      { spec: "3.2.1", name: "The measurement of macroeconomic performance" },
      { spec: "3.2.2", name: "How the macroeconomy works: AD/AS analysis" },
      { spec: "3.2.3", name: "Economic performance" },
      { spec: "3.2.4", name: "Financial markets and monetary policy" },
      { spec: "3.2.5", name: "Fiscal policy and supply-side policies" },
      { spec: "3.2.6", name: "The international economy" },
    ],
  },
];

const SECTION_COLORS: Record<number, { dot: string; chip: string }> = {
  1: { dot: "bg-teal-500", chip: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  2: { dot: "bg-blue-500", chip: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
};

// ---------- Types ----------
type Flashcard = {
  id: string;
  spec_ref: string;
  theme_number: number;
  topic_name: string;
  subtopic_name: string;
  question: string;
  answer: string;
  real_world_example: string | null;
  card_type: "definition" | "mechanism" | "evaluation";
  difficulty_base: number;
};

type Progress = {
  card_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_due_at: string;
  last_reviewed_at: string | null;
  last_rating: string | null;
};

type Rating = "again" | "hard" | "good" | "easy";

// ---------- SM-2 ----------
function updateSM2(
  card: { ease_factor: number; interval_days: number; repetitions: number },
  rating: Rating,
) {
  let { ease_factor, interval_days, repetitions } = card;
  if (rating === "again") {
    repetitions = 0;
    interval_days = 0.0007;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else if (rating === "hard") {
    repetitions = Math.max(0, repetitions - 1);
    interval_days = interval_days < 1 ? 0.004 : interval_days * 1.2;
    ease_factor = Math.max(1.3, ease_factor - 0.15);
  } else if (rating === "good") {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 3;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  } else {
    if (repetitions === 0) interval_days = 4;
    else interval_days = Math.round(interval_days * ease_factor * 1.3);
    repetitions += 1;
    ease_factor = Math.min(3.0, ease_factor + 0.15);
  }
  const next_due_at = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000);
  return {
    ease_factor,
    interval_days,
    repetitions,
    next_due_at: next_due_at.toISOString(),
    last_rating: rating,
    last_reviewed_at: new Date().toISOString(),
  };
}

// ---------- Page ----------
function FlashcardsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<Map<string, Progress>>(new Map());
  const [openThemes, setOpenThemes] = useState<Set<number>>(new Set([1]));

  // session: null = deck browser
  const [session, setSession] = useState<Flashcard[] | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("flashcards").select("*"),
        supabase.from("flashcard_progress").select("*").eq("user_id", u.user.id),
      ]);
      setCards((c ?? []) as Flashcard[]);
      const map = new Map<string, Progress>();
      for (const row of (p ?? []) as Progress[]) map.set(row.card_id, row);
      setProgress(map);
      setLoading(false);
    })();
  }, []);

  const now = Date.now();

  const stats = useMemo(() => {
    const total = cards.length;
    let due = 0;
    let mastered = 0;
    let studiedToday = 0;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    for (const card of cards) {
      const pr = progress.get(card.id);
      if (!pr) {
        due += 1;
      } else {
        if (new Date(pr.next_due_at).getTime() <= now) due += 1;
        if (pr.repetitions >= 3 && pr.ease_factor >= 2.3) mastered += 1;
        if (pr.last_reviewed_at && new Date(pr.last_reviewed_at) >= startOfDay) studiedToday += 1;
      }
    }
    return { total, due, mastered, studiedToday };
  }, [cards, progress, now]);

  const sortCardsForSession = useCallback(
    (pool: Flashcard[]): Flashcard[] => {
      const newCards: Flashcard[] = [];
      const dueCards: { card: Flashcard; due: number }[] = [];
      for (const card of pool) {
        const pr = progress.get(card.id);
        if (!pr) newCards.push(card);
        else if (new Date(pr.next_due_at).getTime() <= now)
          dueCards.push({ card, due: new Date(pr.next_due_at).getTime() });
      }
      newCards.sort((a, b) => a.difficulty_base - b.difficulty_base);
      dueCards.sort((a, b) => a.due - b.due);
      return [...newCards, ...dueCards.map((d) => d.card)];
    },
    [progress, now],
  );

  function startAllDue() {
    const queue = sortCardsForSession(cards);
    if (queue.length === 0) return;
    setSession(queue);
    setSessionTitle("All due cards");
  }

  function startSubtopic(spec: string, name: string) {
    const pool = cards.filter((c) => c.spec_ref === spec);
    if (pool.length === 0) return;
    // For subtopic study, include all cards if none due (review session)
    const queue = sortCardsForSession(pool);
    const finalQueue = queue.length > 0 ? queue : pool;
    setSession(finalQueue);
    setSessionTitle(`${spec} — ${name}`);
  }

  function endSession() {
    setSession(null);
    // Refresh progress
    if (userId) {
      supabase
        .from("flashcard_progress")
        .select("*")
        .eq("user_id", userId)
        .then(({ data }) => {
          const map = new Map<string, Progress>();
          for (const row of (data ?? []) as Progress[]) map.set(row.card_id, row);
          setProgress(map);
        });
    }
  }

  function persistProgress(cardId: string, updated: ReturnType<typeof updateSM2>) {
    if (!userId) return;
    const existing = progress.get(cardId);
    const row = {
      user_id: userId,
      card_id: cardId,
      ease_factor: updated.ease_factor,
      interval_days: updated.interval_days,
      repetitions: updated.repetitions,
      next_due_at: updated.next_due_at,
      last_reviewed_at: updated.last_reviewed_at,
      last_rating: updated.last_rating,
    };
    // optimistic local
    const newMap = new Map(progress);
    newMap.set(cardId, { ...(existing ?? {} as Progress), ...row });
    setProgress(newMap);
    void supabase.from("flashcard_progress").upsert(row, { onConflict: "user_id,card_id" });
  }

  if (loading) {
    return (
      <AppLayout title="Flashcards">
        <div className="text-slate-400 text-sm">Loading flashcards…</div>
      </AppLayout>
    );
  }

  if (session) {
    return (
      <AppLayout title="Flashcards">
        <StudyMode
          initialQueue={session}
          title={sessionTitle}
          onExit={endSession}
          getProgress={(id) => progress.get(id)}
          onRate={persistProgress}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Flashcards">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Flashcards</h2>
          <p className="text-sm text-slate-400 mt-1">
            Spaced-repetition revision across the AQA A-Level Economics spec.
          </p>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center">
            <Layers className="size-10 text-slate-500 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-white text-lg">
              Flashcards are being added — check back soon.
            </h3>
            <p className="text-sm text-slate-400 mt-2">Lessons are available now.</p>
            <Button
              asChild
              className="mt-4 bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold"
            >
              <Link to="/course">Go to lessons</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total cards" value={stats.total} />
              <StatCard label="Due today" value={stats.due} accent={stats.due > 0 ? "gold" : undefined} />
              <StatCard label="Studied today" value={stats.studiedToday} />
              <StatCard label="Mastered" value={stats.mastered} accent="emerald" />
            </div>

            {/* Due banner */}
            {stats.due > 0 && (
              <div className="rounded-xl bg-gold/10 border border-gold/40 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-display font-semibold text-gold">
                    You have {stats.due} card{stats.due === 1 ? "" : "s"} due
                  </p>
                  <p className="text-sm text-slate-300 mt-0.5">
                    Including any you got wrong last session.
                  </p>
                </div>
                <Button
                  onClick={startAllDue}
                  className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold shrink-0"
                >
                  Review all due now →
                </Button>
              </div>
            )}

            {/* Theme accordions */}
            <div className="space-y-3">
              {SECTIONS.map((section) => {
                const open = openThemes.has(section.number);
                const colors = SECTION_COLORS[section.number];
                const themeCardCount = cards.filter((c) => c.theme_number === section.number).length;
                return (
                  <div
                    key={section.number}
                    className="rounded-xl bg-[#1a2744] border border-white/5 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        const next = new Set(openThemes);
                        if (open) next.delete(section.number);
                        else next.add(section.number);
                        setOpenThemes(next);
                      }}
                      className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5"
                    >
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colors.chip}`}
                      >
                        Section {section.code}
                      </span>
                      <span className="flex-1 font-display font-semibold text-white">
                        {section.title}
                      </span>
                      <span className="text-xs text-slate-400">{themeCardCount} cards</span>
                      {open ? (
                        <ChevronDown className="size-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="size-4 text-slate-400" />
                      )}
                    </button>
                    {open && (
                      <div className="border-t border-white/5 divide-y divide-white/5">
                        {section.subtopics.map((sub) => {
                          const subCards = cards.filter((c) => c.spec_ref === sub.spec);
                          const count = subCards.length;
                          let dueCount = 0;
                          let unseen = 0;
                          let reviewedAny = 0;
                          for (const c of subCards) {
                            const pr = progress.get(c.id);
                            if (!pr) {
                              unseen += 1;
                              dueCount += 1;
                            } else {
                              reviewedAny += 1;
                              if (new Date(pr.next_due_at).getTime() <= now) dueCount += 1;
                            }
                          }
                          let pill: { label: string; cls: string } | null = null;
                          if (count > 0) {
                            if (dueCount > 0 && unseen === count) {
                              pill = {
                                label: "new",
                                cls: "bg-blue-500/15 text-blue-300 border-blue-500/30",
                              };
                            } else if (dueCount > 0) {
                              pill = {
                                label: `${dueCount} due`,
                                cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
                              };
                            } else if (reviewedAny === count) {
                              pill = {
                                label: "done",
                                cls: "bg-emerald/15 text-emerald border-emerald/30",
                              };
                            }
                          }
                          return (
                            <button
                              key={sub.spec}
                              disabled={count === 0}
                              onClick={() => startSubtopic(sub.spec, sub.name)}
                              className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-xs font-mono text-slate-400 w-14 shrink-0">
                                {sub.spec}
                              </span>
                              <span className="flex-1 text-sm text-white truncate">{sub.name}</span>
                              <span className="text-xs text-slate-500 shrink-0">
                                {count} card{count === 1 ? "" : "s"}
                              </span>
                              {pill && (
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${pill.cls}`}
                                >
                                  {pill.label}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "gold" | "emerald";
}) {
  const color =
    accent === "gold" ? "text-gold" : accent === "emerald" ? "text-emerald" : "text-white";
  return (
    <div className="rounded-xl bg-[#1a2744] border border-white/5 p-4 sm:p-5">
      <div className={`text-3xl font-display font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

// ---------- Study Mode ----------
function StudyMode({
  initialQueue,
  title,
  onExit,
  getProgress,
  onRate,
}: {
  initialQueue: Flashcard[];
  title: string;
  onExit: () => void;
  getProgress: (id: string) => Progress | undefined;
  onRate: (cardId: string, updated: ReturnType<typeof updateSM2>) => void;
}) {
  const [queue, setQueue] = useState<Flashcard[]>(initialQueue);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState<Record<Rating, number>>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const totalUnique = initialQueue.length;
  const completedUnique = Math.min(
    totalUnique,
    tally.good + tally.easy + tally.hard, // againers loop back
  );

  const card = queue[idx];

  function handleRate(rating: Rating) {
    if (!card) return;
    const existing = getProgress(card.id);
    const base = existing
      ? {
          ease_factor: existing.ease_factor,
          interval_days: existing.interval_days,
          repetitions: existing.repetitions,
        }
      : { ease_factor: 2.5, interval_days: 0, repetitions: 0 };
    const updated = updateSM2(base, rating);
    onRate(card.id, updated);
    setTally((t) => ({ ...t, [rating]: t[rating] + 1 }));

    if (rating === "again") {
      // append same card to end of queue
      setQueue((q) => [...q, card]);
    }
    setRevealed(false);
    setIdx((i) => i + 1);
  }

  // Completion
  if (!card) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-emerald/15 text-emerald mb-4">
          <CheckCircle2 className="size-9" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white">Session complete</h2>
        <p className="text-sm text-slate-400 mt-1">{title}</p>
        <div className="grid grid-cols-4 gap-3 mt-6">
          <Tally label="Again" value={tally.again} color="text-incorrect" />
          <Tally label="Hard" value={tally.hard} color="text-gold" />
          <Tally label="Good" value={tally.good} color="text-emerald" />
          <Tally label="Easy" value={tally.easy} color="text-blue-400" />
        </div>
        <Button
          onClick={onExit}
          className="mt-8 bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold"
        >
          Back to decks
        </Button>
      </div>
    );
  }

  const progressPct = totalUnique > 0 ? Math.min(100, (completedUnique / totalUnique) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Back to decks
        </button>
        <div className="flex-1 text-center text-sm text-slate-300 font-medium truncate px-2">
          {title}
        </div>
        <div className="text-xs text-slate-400 font-mono shrink-0">
          {Math.min(completedUnique + 1, totalUnique)} / {totalUnique}
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-6">
        <div
          className="h-full bg-emerald transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Card */}
      <div
        onClick={() => !revealed && setRevealed(true)}
        className={`rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-lg p-6 sm:p-8 ${!revealed ? "cursor-pointer hover:shadow-xl" : ""}`}
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
          Question
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {card.spec_ref} · {card.topic_name}
        </div>
        <div className="text-lg sm:text-xl font-medium leading-relaxed mt-4 text-slate-900">
          {card.question}
        </div>

        {!revealed && (
          <div className="text-xs text-slate-400 mt-6 text-center">Tap to reveal answer</div>
        )}

        {revealed && (
          <>
            <hr className="my-6 border-slate-200" />
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
              Answer
            </div>
            <div className="text-base sm:text-lg leading-relaxed mt-3 text-slate-800 whitespace-pre-wrap">
              {card.answer}
            </div>
            {card.real_world_example && (
              <div className="mt-5 border-l-4 border-emerald bg-emerald/5 rounded-r-lg p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald uppercase tracking-wider">
                  <Globe2 className="size-3.5" />
                  Real-world example
                  <span className="inline-flex items-center gap-1 text-gold normal-case">
                    <Sparkles className="size-3" /> A* knowledge
                  </span>
                </div>
                <div className="text-sm mt-2 text-slate-800 leading-relaxed">
                  {card.real_world_example}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rating buttons */}
      {revealed && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <RatingButton
              label="Again"
              onClick={() => handleRate("again")}
              cls="bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40"
            />
            <RatingButton
              label="Hard"
              onClick={() => handleRate("hard")}
              cls="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40"
            />
            <RatingButton
              label="Good"
              onClick={() => handleRate("good")}
              cls="bg-emerald/15 hover:bg-emerald/25 text-emerald border-emerald/40"
            />
            <RatingButton
              label="Easy"
              onClick={() => handleRate("easy")}
              cls="bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/40"
            />
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Again → 1 min · Hard → 6 min · Good → tomorrow · Easy → 4 days
          </p>
        </>
      )}
    </div>
  );
}

function RatingButton({
  label,
  onClick,
  cls,
}: {
  label: string;
  onClick: () => void;
  cls: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 font-semibold text-sm transition-colors ${cls}`}
    >
      {label}
    </button>
  );
}

function Tally({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-[#1a2744] border border-white/5 p-3">
      <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
