import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Markdown } from "@/components/app/Markdown";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Clock, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { getPublicLesson } from "@/lib/public-lesson.functions";

export const Route = createFileRoute("/lessons/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicLesson({ data: { slug: params.slug } });
    if (!data.lesson) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.lesson) {
      return { meta: [{ title: "Lesson not found — EconAStar" }] };
    }
    const lesson = loaderData.lesson;
    const stripped = (loaderData.firstBlockMarkdown ?? "")
      .replace(/[#*_`>\[\]()!-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const description = stripped.length > 150 ? stripped.slice(0, 147) + "…" : stripped || `${lesson.title} — A-Level Economics lesson on EconAStar.`;
    const url = `https://econastar.com/lessons/${params.slug}`;
    return {
      meta: [
        { title: `${lesson.title} — A-Level Economics | EconAStar` },
        { name: "description", content: description },
        { property: "og:title", content: `${lesson.title} — A-Level Economics` },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: lesson.title,
            description,
            educationalLevel: "A-Level",
            learningResourceType: "Lesson",
            about: "Economics",
            educationalAlignment: lesson.spec_reference
              ? { "@type": "AlignmentObject", alignmentType: "educationalSubject", targetName: `AQA Economics ${lesson.spec_reference}` }
              : undefined,
            url,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-navy text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-display font-bold mb-3">Lesson not found</h1>
        <p className="text-slate-soft mb-6">This lesson may have moved or been removed.</p>
        <Button asChild className="bg-emerald hover:bg-emerald-hover text-white">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen bg-navy text-white flex items-center justify-center p-6">
      <p>Something went wrong loading this lesson.</p>
    </div>
  ),
  component: PublicLessonPage,
});

function PublicLessonPage() {
  const { lesson, firstBlockMarkdown, hasMoreBlocks, prev, next } = Route.useLoaderData();
  if (!lesson) return null;

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 h-9 hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-emerald hover:bg-emerald-hover text-white font-semibold h-9">
              <Link to="/signup">Sign up free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article>
          {lesson.spec_reference && (
            <p className="text-xs uppercase tracking-wider text-emerald font-semibold mb-3">
              AQA {lesson.spec_reference}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl font-display font-bold leading-tight">{lesson.title}</h1>
          {lesson.estimated_minutes && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-soft">
              <Clock className="size-4" /> {lesson.estimated_minutes} min read
            </p>
          )}

          <div className="mt-8 prose-invert">
            {firstBlockMarkdown ? (
              <Markdown source={firstBlockMarkdown} />
            ) : (
              <p className="text-slate-soft">This lesson is being prepared.</p>
            )}
          </div>

          {/* Locked overlay */}
          {hasMoreBlocks && (
            <div className="mt-10 relative">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-navy/60 to-navy" />
              <div
                aria-hidden
                className="select-none blur-sm opacity-40 space-y-3 px-2"
              >
                <p className="text-slate-300">Continue with worked examples, quiz questions, key terms, and a one-page summary — all included in the full lesson on EconAStar.</p>
                <p className="text-slate-300">Sample exam-style question follows…</p>
                <p className="text-slate-300">Diagram walkthrough: PED, tax incidence, consumer surplus…</p>
                <p className="text-slate-300">Key term: Price elasticity of demand — the responsiveness of quantity demanded to a change in price…</p>
              </div>
              <div className="mt-6 rounded-2xl border-2 border-emerald/40 bg-[#0f1c2e] p-6 sm:p-8 text-center space-y-4">
                <div className="size-12 mx-auto rounded-full bg-emerald/15 flex items-center justify-center">
                  <Lock className="size-6 text-emerald" />
                </div>
                <h2 className="text-2xl font-display font-bold">Sign up free to continue reading</h2>
                <p className="text-slate-soft max-w-md mx-auto">
                  Full lesson includes worked examples, exam-style quiz questions with feedback, key terms, and an A* summary.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button asChild className="bg-emerald hover:bg-emerald-hover text-white font-semibold h-11 px-6">
                    <Link to="/signup">Sign up free</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 h-11 px-6">
                    <Link to="/login">Already have an account? Sign in</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </article>

        {/* Prev / Next */}
        {(prev || next) && (
          <nav className="mt-12 pt-8 border-t border-white/10 grid sm:grid-cols-2 gap-4">
            {prev ? (
              <Link
                to="/lessons/$slug"
                params={{ slug: prev.slug }}
                className="rounded-xl border border-white/10 hover:border-white/30 p-4 transition-colors"
              >
                <p className="text-xs text-slate-soft inline-flex items-center gap-1">
                  <ArrowLeft className="size-3" /> Previous lesson
                </p>
                <p className="mt-1 font-semibold text-white">{prev.title}</p>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                to="/lessons/$slug"
                params={{ slug: next.slug }}
                className="rounded-xl border border-white/10 hover:border-white/30 p-4 transition-colors sm:text-right"
              >
                <p className="text-xs text-slate-soft inline-flex items-center gap-1 sm:justify-end sm:w-full">
                  Next lesson <ArrowRight className="size-3" />
                </p>
                <p className="mt-1 font-semibold text-white">{next.title}</p>
              </Link>
            ) : <div />}
          </nav>
        )}
      </main>
    </div>
  );
}
