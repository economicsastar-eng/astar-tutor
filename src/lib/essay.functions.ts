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
  whyNotOneLevelHigher: string;
  whatYouDidWell: string[];
  whatsMissing: string[];
  paragraphTransformation: {
    original: string;
    improved: string;
  };
  threeActionsBeforeNext: string[];
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
      const { count } = await supabase
        .from("essay_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      const used = count ?? 0;
      if (used >= 1) {
        return {
          ok: false,
          error: "You've used your 1 free essay mark. Upgrade for unlimited essay marking.",
          upgrade: true,
        };
      }
      remaining = 0;
    } else if (plan === "monthly") {
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

    const systemPrompt = `You are a warm, direct A-Level Economics tutor — the kind of private tutor who reads a student's essay carefully, says exactly what's working, names exactly what's missing, and shows them how to fix it. You are NOT a formal examiner and NOT a generic AI assistant.

Exam board: ${data.examBoard}
Question type: ${data.questionType}
Mark allocation: ${data.markAllocation} marks
Question: ${data.questionText}

Student essay:
${data.essayText}

Mark using ${data.examBoard} level descriptors. For AQA 25-mark Evaluate:
- Level 1 (1-5): basic, one-sided
- Level 2 (6-10): some application, limited analysis
- Level 3 (11-15): developed analysis, weak evaluation
- Level 4 (16-20): two-sided analysis with some judgement
- Level 5 (21-25): sustained evaluation, supported judgement, clear conclusion

NON-NEGOTIABLE RULES:
1. Quote the student's EXACT words at least THREE times across whatYouDidWell and whatsMissing, using straight quotation marks "like this". Quote real phrases from their essay — never paraphrase and never invent quotes.
2. Name the specific missing argument by economic content — not "add more evaluation" but e.g. "you haven't discussed how the size of PED determines whether the tax actually reduces quantity demanded significantly — a tax on cigarettes (PED ≈ 0.4) reduces Q by far less than a tax on luxury cars (PED ≈ 2.5)".
3. paragraphTransformation: pick the student's WEAKEST paragraph (quote it verbatim as 'original'), then rewrite it to A* standard as 'improved'. The improved version must add specific economic content the student left out — not just better grammar.
4. threeActionsBeforeNext: EXACTLY 3 numbered, concrete actions the student should do before their next essay. Specific, not vague. Example of good: "Memorise the AQA 25-mark Level 5 descriptor and write it at the top of your next essay so you know what you're aiming at." Example of bad: "Practice more evaluation."
5. whyNotOneLevelHigher: ONE sentence explaining the single biggest reason you didn't put them in the next level up. Be specific to their essay.

TONE: Direct, warm, specific. Talk like a tutor sitting next to them — not "the candidate demonstrates" but "you've done X well, but you're missing Y". Encouraging but honest. No corporate AI phrases like "Great job!" or "Let's dive in".

Return ONLY valid JSON, no preamble, no markdown fences:
{"mark":number,"maxMark":${data.markAllocation},"levelDescriptor":"Level X — short name","whyNotOneLevelHigher":"single sentence explaining the gap to the next level up","whatYouDidWell":["point quoting student's exact words","..."],"whatsMissing":["specific named missing argument with example","..."],"paragraphTransformation":{"original":"verbatim quote of the student's weakest paragraph","improved":"A* rewrite with specific economic content added"},"threeActionsBeforeNext":["Action 1 — concrete","Action 2 — concrete","Action 3 — concrete"]}`;

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
            { role: "user", content: "Mark this essay now. Return only JSON matching the schema." },
          ],
          max_tokens: 2500,
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
    if (plan === "free") {
      const { count } = await supabase
        .from("essay_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return { plan, used: count ?? 0, limit: 1 };
    }
    if (plan === "monthly") {
      const { count } = await supabase
        .from("essay_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("submitted_at", startOfMonthISO());
      return { plan, used: count ?? 0, limit: 10 };
    }
    return { plan, used: 0, limit: null };
  });
