import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TutorMessage = { role: "user" | "assistant"; content: string; timestamp: string };

const SendSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().nullable(),
});

const IdSchema = z.object({ conversationId: z.string().uuid() });

function startOfTodayISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export type SendTutorResult =
  | { ok: true; response: string; conversationId: string; remaining: number | null }
  | { ok: false; error: string; upgrade?: boolean };

export const sendTutorMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SendSchema.parse(data))
  .handler(async ({ data, context }): Promise<SendTutorResult> => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan,exam_board,target_grade")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) return { ok: false, error: "Profile not found" };

    const plan = profile.plan ?? "free";
    let remaining: number | null = null;

    if (plan === "free") {
      const since = startOfTodayISO();
      const { data: convs } = await supabase
        .from("tutor_conversations")
        .select("messages")
        .eq("user_id", userId)
        .gte("updated_at", since);
      const used = (convs ?? []).reduce((acc: number, c: { messages: unknown }) => {
        const msgs = Array.isArray(c.messages) ? (c.messages as TutorMessage[]) : [];
        return acc + msgs.filter((m) => m.role === "user" && m.timestamp >= since).length;
      }, 0);
      if (used >= 3) {
        return { ok: false, error: "You've used your 3 free messages for today. Upgrade for unlimited.", upgrade: true };
      }
      remaining = 3 - used - 1;
    }

    let conversationId = data.conversationId;
    let history: TutorMessage[] = [];
    let isNew = false;
    if (conversationId) {
      const { data: conv } = await supabase
        .from("tutor_conversations")
        .select("id,messages")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!conv) return { ok: false, error: "Conversation not found" };
      history = (Array.isArray(conv.messages) ? conv.messages : []) as TutorMessage[];
    } else {
      isNew = true;
      const { data: created, error } = await supabase
        .from("tutor_conversations")
        .insert({ user_id: userId, title: data.message.slice(0, 50) || "New chat", messages: [] })
        .select("id")
        .single();
      if (error || !created) return { ok: false, error: "Could not start conversation" };
      conversationId = created.id;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, error: "AI service not configured" };

    const systemPrompt = `You are EconAStar's economics tutor — an expert A-Level Economics tutor built by a practising UK teacher.

The student's exam board is: ${profile.exam_board || "AQA"}
The student's target grade is: ${profile.target_grade || "A*"}

Rules:
1. Only answer A-Level Economics questions. For anything else: "I'm your economics tutor — ask me anything about A-Level Economics!"
2. Never pester or prompt. Only respond when asked. Never say "Would you like to explore this further?" or "Do you have any other questions?"
3. Use real-world UK examples a 17-year-old would know.
4. Structure: (a) Plain-English definition, (b) How it works, (c) Real-world example, (d) How examined, (e) What A* answer includes.
5. Never write a full essay. Guide with questions: "What argument would you start with?"
6. Reference AQA command words: Explain = chain of reasoning. Evaluate = judgement + both sides.
7. When diagrams are relevant: "Draw AD/AS with Price Level on Y, Real GDP on X..."
8. Correct wrong understanding clearly and kindly.
9. Keep responses under 250 words.
10. Do not reference content not on the ${profile.exam_board || "AQA"} specification.`;

    const apiMessages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Anthropic error", res.status, t);
      return { ok: false, error: "Tutor service unavailable. Please try again." };
    }

    const json = (await res.json()) as { content: Array<{ type: string; text: string }> };
    const reply = json.content?.find((c) => c.type === "text")?.text?.trim() ?? "";

    const now = new Date().toISOString();
    const updatedMessages: TutorMessage[] = [
      ...history,
      { role: "user", content: data.message, timestamp: now },
      { role: "assistant", content: reply, timestamp: new Date().toISOString() },
    ];

    const updates: { messages: TutorMessage[]; title?: string } = { messages: updatedMessages };
    if (isNew) updates.title = data.message.slice(0, 50) || "New chat";

    await supabase
      .from("tutor_conversations")
      .update(updates)
      .eq("id", conversationId)
      .eq("user_id", userId);

    return { ok: true, response: reply, conversationId: conversationId!, remaining };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("tutor_conversations")
      .select("id,title,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    return { conversations: data ?? [] };
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: conv } = await supabase
      .from("tutor_conversations")
      .select("id,title,messages")
      .eq("id", data.conversationId)
      .eq("user_id", userId)
      .maybeSingle();
    return {
      conversation: conv
        ? { id: conv.id, title: conv.title, messages: (conv.messages as TutorMessage[]) ?? [] }
        : null,
    };
  });

export const getTutorUsage = createServerFn({ method: "GET" })
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
    if (plan === "free") {
      const since = startOfTodayISO();
      const { data: convs } = await supabase
        .from("tutor_conversations")
        .select("messages")
        .eq("user_id", userId)
        .gte("updated_at", since);
      used = (convs ?? []).reduce((acc: number, c: { messages: unknown }) => {
        const msgs = Array.isArray(c.messages) ? (c.messages as TutorMessage[]) : [];
        return acc + msgs.filter((m) => m.role === "user" && m.timestamp >= since).length;
      }, 0);
    }
    return { plan, used, limit: plan === "free" ? 3 : null };
  });
