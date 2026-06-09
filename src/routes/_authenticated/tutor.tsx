import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "Tutor — EconAStar" }] }),
  component: TutorPage,
});

function TutorPage() {
  return (
    <AppLayout title="Your Economics Tutor">
      <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center">
        <h2 className="text-xl font-display font-bold text-white mb-2">Tutor chat coming next</h2>
        <p className="text-slate-400">Ask any A-Level Economics question and get clear, examiner-aligned answers. Ships in the next phase.</p>
      </div>
    </AppLayout>
  );
}
