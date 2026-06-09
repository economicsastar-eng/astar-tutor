import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Review — EconAStar" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  return (
    <AppLayout title="Review Session">
      <div className="rounded-xl bg-[#1a2744] border border-white/5 p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-display font-bold text-white mb-2">All caught up!</h2>
        <p className="text-slate-400">No reviews due right now. Once you complete some lessons, questions you get wrong will appear here on a spaced-repetition schedule.</p>
      </div>
    </AppLayout>
  );
}
