import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  questionText: z.string().min(1),
  examBoard: z.string().min(1),
  questionType: z.string().min(1),
  markAllocation: z.number().int().positive(),
  essayText: z.string().min(1),
});

export type EssayFeedback = {
  mark: number;
  maxMark: number;
  levelDescriptor: string;
  whatYouDidWell: string[];
  whatsMissing: string[];
  improvedParagraph: string;
  oneAction: string;
};

export type MarkEssayResult =
  | { ok: true; feedback: EssayFeedback; remaining: number | null }
  | { ok: false; error: string; upgrade?: boolean };

function startOfMonthISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export const markEssay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }): Promise<MarkEssayResult> => {
    const { supabase, userId } = context;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    if (profileErr || !profile) return { ok: false, error: "Profile not found" };

    const plan = profile.plan ?? "free";
    let remaining: number | null = null;

    if (plan === "free") {
      return { ok: false, error: "Essay marking is a premium feature", upgrade: true };
    }
    if (plan === "monthly") {
      const { count } = await supabase
        .from("essay_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("submitted_at", startOfMonthISO());
      const used = count ?? 0;
      if (used >= 10) {
        return { ok: false, error: "You've used all 10 essay marks this month", upgrade: true };
      }
      remaining = 10 - used - 1;
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, error: "AI service not configured (LOVABLE_API_KEY missing)" };

    const systemPrompt = `You are an experienced A-Level Economics examiner with 15 years of marking experience across AQA, Edexcel, OCR, and WJEC/Eduqas.

Exam board: ${data.examBoard}
Question type: ${data.questionType}
Mark allocation: ${data.markAllocation} marks
Question: ${data.questionText}

Student essay:
${data.essayText}

Apply the correct mark scheme levels for the specified exam board.

For AQA:
- 4-mark: Level 1 (1-2, basic knowledge), Level 2 (3-4, developed chain of reasoning)
- 8-mark: Level 1 (1-3), Level 2 (4-6), Level 3 (7-8, two developed chains with application)
- 15-mark: Level 1 (1-5), Level 2 (6-9), Level 3 (10-12), Level 4 (13-15, two-sided evaluation with judgement)
- 25-mark: Level 1 (1-5), Level 2 (6-10), Level 3 (11-15), Level 4 (16-20), Level 5 (21-25, sustained evaluation with conclusion)

If the student describes a diagram, assess it for correct axes, curves, shifts, and equilibrium.

Return ONLY valid JSON, no preamble, no markdown fences:
{"mark":number,"maxMark":number,"levelDescriptor":"Level X - description","whatYouDidWell":["quote exact student words","..."],"whatsMissing":["specific gap with example sentence","..."],"improvedParagraph":"rewritten weakest paragraph at A* standard","oneAction":"single concrete actionable instruction"}

RULES:
- whatYouDidWell MUST quote exact words from the student's essay. Never generic praise.
- whatsMissing must name the specific missing argument and give a concrete example sentence of what should be there.
- If the essay is weak, be encouraging first, then honest.
- Never mention content not on the stated exam board's spec.
- oneAction must be immediately actionable, not vague.`;

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Please mark this essay now and return only JSON." },
          ],
          max_tokens: 2000,
        }),
      });
    } catch (err) {
      console.error("[markEssay] fetch threw:", err);
      const m = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Network error calling AI gateway: ${m}` };
    }

    if (!res.ok) {
      const t = await res.text();
      console.error("[markEssay] AI gateway error", res.status, t);
      if (res.status === 429) return { ok: false, error: "Rate limit hit. Please retry shortly." };
      if (res.status === 402) return { ok: false, error: "AI credits exhausted. Add credits in Workspace → Usage." };
      return { ok: false, error: `AI gateway ${res.status}: ${t.slice(0, 300)}` };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    let feedback: EssayFeedback;
    try {
      feedback = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) {
        console.error("[markEssay] could not parse model output:", text);
        return { ok: false, error: `Could not parse AI response: ${text.slice(0, 200)}` };
      }
      feedback = JSON.parse(m[0]);
    }

    await supabase.from("essay_submissions").insert({
      user_id: userId,
      question_text: data.questionText,
      exam_board: data.examBoard,
      question_type: data.questionType,
      mark_allocation: data.markAllocation,
      essay_text: data.essayText,
      mark_awarded: feedback.mark,
      max_mark: feedback.maxMark,
      feedback_json: feedback,
    });

    return { ok: true, feedback, remaining };
  });

export const getEssayUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    const plan = profile?.plan ?? "free";
    let used = 0;
    if (plan === "monthly") {
      const { count } = await supabase
        .from("essay_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("submitted_at", startOfMonthISO());
      used = count ?? 0;
    }
    return { plan, used, limit: plan === "monthly" ? 10 : null };
  });
