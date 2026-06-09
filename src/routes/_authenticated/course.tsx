import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";

export const Route = createFileRoute("/_authenticated/course")({
  head: () => ({ meta: [{ title: "Course — EconAStar" }] }),
  component: CoursePage,
});

function CoursePage() {
  return (
    <AppLayout title="Course">
      <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center">
        <h2 className="text-xl font-display font-bold text-white mb-2">Course view coming next</h2>
        <p className="text-slate-400">The linear course with section accordions, sequential unlocking, and the lesson player ships in the next phase.</p>
      </div>
    </AppLayout>
  );
}
