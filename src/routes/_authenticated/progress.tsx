import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress — EconAStar" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <AppLayout title="Progress">
      <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center">
        <h2 className="text-xl font-display font-bold text-white mb-2">Progress dashboard coming next</h2>
        <p className="text-slate-400">Predicted grade, section breakdown, performance trend, topic mastery, and a 90-day activity heatmap. Ships in the next phase.</p>
      </div>
    </AppLayout>
  );
}
