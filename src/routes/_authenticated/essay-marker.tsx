import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";

export const Route = createFileRoute("/_authenticated/essay-marker")({
  head: () => ({ meta: [{ title: "Essay Marker — EconAStar" }] }),
  component: EssayMarkerPage,
});

function EssayMarkerPage() {
  return (
    <AppLayout title="Essay Marker">
      <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center">
        <h2 className="text-xl font-display font-bold text-white mb-2">Essay Marker coming next</h2>
        <p className="text-slate-400">Paste an exam question and your essay answer, and get examiner-level feedback. Ships in the next phase.</p>
      </div>
    </AppLayout>
  );
}
