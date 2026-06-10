import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicLessonData = {
  lesson: {
    id: string;
    title: string;
    slug: string;
    spec_reference: string | null;
    estimated_minutes: number | null;
    sort_order: number;
  } | null;
  firstBlockMarkdown: string | null;
  hasMoreBlocks: boolean;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export const getPublicLesson = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }): Promise<PublicLessonData> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select("id,title,slug,spec_reference,estimated_minutes,sort_order")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!lesson) {
      return { lesson: null, firstBlockMarkdown: null, hasMoreBlocks: false, prev: null, next: null };
    }

    const { data: blocks } = await supabaseAdmin
      .from("lesson_blocks")
      .select("block_type,sort_order,content_markdown")
      .eq("lesson_id", lesson.id)
      .order("sort_order");

    const blockList = blocks ?? [];
    const firstContent = blockList.find((b) => b.block_type === "content");
    const hasMore = blockList.length > 1;

    const [{ data: prev }, { data: next }] = await Promise.all([
      supabaseAdmin
        .from("lessons")
        .select("slug,title")
        .lt("sort_order", lesson.sort_order)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("lessons")
        .select("slug,title")
        .gt("sort_order", lesson.sort_order)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      lesson,
      firstBlockMarkdown: firstContent?.content_markdown ?? null,
      hasMoreBlocks: hasMore,
      prev: prev ?? null,
      next: next ?? null,
    };
  });
