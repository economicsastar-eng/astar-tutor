import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress — EconAStar" }] }),
  component: ProgressPage,
});

type Attempt = {
  is_correct: boolean;
  attempted_at: string;
  lesson_id: string | null;
};

type Lesson = { id: string; title: string; section_id: string };
type Section = { id: string; theme_number: number; title: string };
type Activity = { activity_date: string; questions_answered: number; lessons_completed: number };

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

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const userId = u.user.id;

      const ninety = new Date();
      ninety.setDate(ninety.getDate() - 90);

      const [aRes, lRes, sRes, actRes] = await Promise.all([
        supabase
          .from("quiz_attempts")
          .select("is_correct,attempted_at,lesson_id")
          .eq("user_id", userId)
          .gte("attempted_at", ninety.toISOString())
          .order("attempted_at", { ascending: true }),
        supabase.from("lessons").select("id,title,section_id"),
        supabase.from("sections").select("id,theme_number,title").order("sort_order"),
        supabase
          .from("user_activity")
          .select("activity_date,questions_answered,lessons_completed")
          .eq("user_id", userId)
          .gte("activity_date", fmtDate(ninety)),
      ]);

      setAttempts((aRes.data as Attempt[]) ?? []);
      setLessons((lRes.data as Lesson[]) ?? []);
      setSections((sRes.data as Section[]) ?? []);
      setActivity((actRes.data as Activity[]) ?? []);
      setLoading(false);
    })();
  }, []);

  // Overall predicted grade
  const overall = useMemo(() => {
    const total = attempts.length;
    const correct = attempts.filter((a) => a.is_correct).length;
    const acc = total ? (correct / total) * 100 : 0;
    return { total, correct, acc, ...gradeFromAccuracy(acc, total) };
  }, [attempts]);

  // Section breakdown
  const sectionStats = useMemo(() => {
    const lessonToSection = new Map(lessons.map((l) => [l.id, l.section_id]));
    const map = new Map<string, { correct: number; total: number }>();
    for (const a of attempts) {
      if (!a.lesson_id) continue;
      const sid = lessonToSection.get(a.lesson_id);
      if (!sid) continue;
      const cur = map.get(sid) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (a.is_correct) cur.correct += 1;
      map.set(sid, cur);
    }
    return sections.map((s) => {
      const v = map.get(s.id) ?? { correct: 0, total: 0 };
      const acc = v.total ? Math.round((v.correct / v.total) * 100) : 0;
      return { ...s, total: v.total, correct: v.correct, acc };
    });
  }, [attempts, lessons, sections]);

  // Last 30-day accuracy trend
  const trendData = useMemo(() => {
    const days: { date: string; label: string; acc: number | null; total: number }[] = [];
    const byDay = new Map<string, { c: number; t: number }>();
    for (const a of attempts) {
      const d = a.attempted_at.slice(0, 10);
      const v = byDay.get(d) ?? { c: 0, t: 0 };
      v.t += 1;
      if (a.is_correct) v.c += 1;
      byDay.set(d, v);
    }
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = fmtDate(d);
      const v = byDay.get(key);
      days.push({
        date: key,
        label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        acc: v ? Math.round((v.c / v.t) * 100) : null,
        total: v?.t ?? 0,
      });
    }
    return days;
  }, [attempts]);

  // Topic mastery (per lesson)
  const topics = useMemo(() => {
    const lessonMap = new Map(lessons.map((l) => [l.id, l]));
    const map = new Map<string, { correct: number; total: number }>();
    for (const a of attempts) {
      if (!a.lesson_id) continue;
      const cur = map.get(a.lesson_id) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (a.is_correct) cur.correct += 1;
      map.set(a.lesson_id, cur);
    }
    const arr = Array.from(map.entries())
      .map(([id, v]) => {
        const l = lessonMap.get(id);
        const acc = v.total ? Math.round((v.correct / v.total) * 100) : 0;
        let status: "mastered" | "reviewing" | "struggling" = "reviewing";
        if (v.total >= 5 && acc >= 85) status = "mastered";
        else if (acc < 50) status = "struggling";
        return {
          id,
          title: l?.title ?? "Unknown",
          total: v.total,
          acc,
          status,
        };
      })
      .sort((a, b) => {
        const order = { struggling: 0, reviewing: 1, mastered: 2 } as const;
        return order[a.status] - order[b.status] || b.total - a.total;
      });
    return arr;
  }, [attempts, lessons]);

  // 90-day heatmap
  const heatmap = useMemo(() => {
    const map = new Map(activity.map((a) => [a.activity_date, a.questions_answered]));
    const cells: { date: string; count: number; level: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = fmtDate(d);
      const count = map.get(key) ?? 0;
      let level = 0;
      if (count >= 1) level = 1;
      if (count >= 5) level = 2;
      if (count >= 15) level = 3;
      if (count >= 30) level = 4;
      cells.push({ date: key, count, level });
    }
    return cells;
  }, [activity]);

  if (loading) {
    return (
      <AppLayout title="Progress">
        <div className="text-slate-400">Loading your progress…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Progress">
      <div className="space-y-6">
        {/* Predicted grade hero */}
        <section className="rounded-xl bg-gradient-to-br from-[#1a2744] to-[#101a30] border border-white/5 p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <p className="text-slate-400 text-sm uppercase tracking-wider">Predicted Grade</p>
            <p className="text-slate-300 mt-1 text-sm">
              Based on {overall.total} quiz attempt{overall.total === 1 ? "" : "s"} ·{" "}
              {Math.round(overall.acc)}% accuracy
            </p>
            {overall.total < 20 && (
              <p className="text-slate-500 text-xs mt-2">
                Answer at least 20 questions for a confident prediction.
              </p>
            )}
          </div>
          <div className={`text-[8rem] leading-none font-display font-bold ${overall.color}`}>
            {overall.grade}
          </div>
        </section>

        {/* Section breakdown */}
        <section className="rounded-xl bg-[#1a2744] border border-white/5 p-6">
          <h2 className="text-lg font-display font-bold text-white mb-4">Section Breakdown</h2>
          <div className="space-y-4">
            {sectionStats.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-white text-sm">
                    Theme {s.theme_number}: <span className="text-slate-300">{s.title}</span>
                  </span>
                  <span className="text-sm tabular-nums">
                    <span className="text-white font-medium">{s.acc}%</span>
                    <span className="text-slate-500 ml-2 text-xs">{s.total} qs</span>
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.acc >= 80 ? "bg-emerald" : s.acc >= 60 ? "bg-gold" : s.total === 0 ? "bg-slate-700" : "bg-incorrect"
                    }`}
                    style={{ width: `${s.total === 0 ? 0 : Math.max(s.acc, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trend chart */}
        <section className="rounded-xl bg-[#1a2744] border border-white/5 p-6">
          <h2 className="text-lg font-display font-bold text-white mb-1">Accuracy — Last 30 Days</h2>
          <p className="text-slate-400 text-sm mb-4">Days with no attempts are skipped.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  interval={Math.floor(trendData.length / 6)}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    background: "#101a30",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  formatter={(v: any, _n, p: any) => [
                    v === null ? "No attempts" : `${v}% (${p?.payload?.total} qs)`,
                    "Accuracy",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="acc"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Topic mastery */}
        <section className="rounded-xl bg-[#1a2744] border border-white/5 p-6">
          <h2 className="text-lg font-display font-bold text-white mb-4">Topic Mastery</h2>
          {topics.length === 0 ? (
            <p className="text-slate-400 text-sm">Complete some quizzes to see topic mastery.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/5">
                    <th className="pb-2 font-medium">Topic</th>
                    <th className="pb-2 font-medium text-right">Attempts</th>
                    <th className="pb-2 font-medium text-right">Accuracy</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 text-white">{t.title}</td>
                      <td className="py-2.5 text-right text-slate-300 tabular-nums">{t.total}</td>
                      <td className="py-2.5 text-right text-white tabular-nums">{t.acc}%</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            t.status === "mastered"
                              ? "bg-emerald/20 text-emerald"
                              : t.status === "struggling"
                              ? "bg-incorrect/20 text-incorrect"
                              : "bg-gold/20 text-gold"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Activity heatmap */}
        <section className="rounded-xl bg-[#1a2744] border border-white/5 p-6">
          <h2 className="text-lg font-display font-bold text-white mb-1">Activity — Last 90 Days</h2>
          <p className="text-slate-400 text-sm mb-4">Questions answered each day.</p>
          <div className="overflow-x-auto">
            <div
              className="grid grid-flow-col grid-rows-7 gap-1 min-w-fit"
              style={{ gridAutoColumns: "12px" }}
            >
              {heatmap.map((c) => (
                <div
                  key={c.date}
                  title={`${c.date}: ${c.count} question${c.count === 1 ? "" : "s"}`}
                  className={`w-3 h-3 rounded-sm ${
                    c.level === 0
                      ? "bg-white/5"
                      : c.level === 1
                      ? "bg-emerald/30"
                      : c.level === 2
                      ? "bg-emerald/50"
                      : c.level === 3
                      ? "bg-emerald/75"
                      : "bg-emerald"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-white/5" />
            <div className="w-3 h-3 rounded-sm bg-emerald/30" />
            <div className="w-3 h-3 rounded-sm bg-emerald/50" />
            <div className="w-3 h-3 rounded-sm bg-emerald/75" />
            <div className="w-3 h-3 rounded-sm bg-emerald" />
            <span>More</span>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
