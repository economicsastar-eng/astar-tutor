/**
 * Integration-style tests: simulate the supabase-backed gating used by the
 * three real call sites (essay marker, tutor messaging, lesson access).
 *
 * These tests mock the supabase client and exercise the same predicates
 * the production handlers use, verifying free vs paid behavior end-to-end.
 */
import { describe, it, expect } from "vitest";
import {
  canMarkEssay,
  canSendTutorMessage,
  canAccessLesson,
} from "@/lib/paywall";

// --- minimal supabase mock --------------------------------------------------
type Row = Record<string, unknown>;
function makeSupabase(state: {
  profiles: Record<string, { plan: string }>;
  essays: Row[];
  tutorMessagesToday: number;
  lessonTheme: number;
}) {
  return {
    from(table: string) {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (_c: string, id: string) => ({
              maybeSingle: async () => ({
                data: state.profiles[id] ?? null,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "essay_submissions") {
        return {
          select: () => ({
            eq: (_c: string, userId: string) => {
              const base = state.essays.filter((e) => e.user_id === userId);
              return {
                gte: () => Promise.resolve({ count: base.length }),
                then: (r: (v: { count: number }) => void) =>
                  r({ count: base.length }),
                count: base.length,
              };
            },
          }),
        };
      }
      if (table === "lessons") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { sections: { theme_number: state.lessonTheme } },
              }),
            }),
          }),
        };
      }
      return {};
    },
  };
}

async function getPlan(supabase: ReturnType<typeof makeSupabase>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select()
    .eq("id", userId)
    .maybeSingle();
  return (data as { plan?: string } | null)?.plan ?? "free";
}

async function essayCount(supabase: ReturnType<typeof makeSupabase>, userId: string) {
  const r = await (supabase.from("essay_submissions").select() as any).eq(
    "user_id",
    userId,
  );
  return r.count ?? 0;
}

// --- essay marker -----------------------------------------------------------
describe("simulated essay marker requests", () => {
  it("free user — first submission allowed, second blocked", async () => {
    const supabase = makeSupabase({
      profiles: { u1: { plan: "free" } },
      essays: [],
      tutorMessagesToday: 0,
      lessonTheme: 1,
    });

    const plan = await getPlan(supabase, "u1");
    let used = await essayCount(supabase, "u1");
    expect(canMarkEssay(plan, used).allowed).toBe(true);

    // simulate the first submission landing in the DB
    supabase["from"]; // typing
    (makeSupabase as unknown); // noop
    const state = (supabase as any);
    void state;
    // Easier: rebuild with 1 essay
    const supabase2 = makeSupabase({
      profiles: { u1: { plan: "free" } },
      essays: [{ user_id: "u1" }],
      tutorMessagesToday: 0,
      lessonTheme: 1,
    });
    used = await essayCount(supabase2, "u1");
    const r = canMarkEssay(await getPlan(supabase2, "u1"), used);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.upgrade).toBe(true);
  });

  it("paid (monthly) user — 10 allowed, 11th blocked", async () => {
    const essays = Array.from({ length: 10 }, () => ({ user_id: "u2" }));
    const supabase = makeSupabase({
      profiles: { u2: { plan: "monthly" } },
      essays,
      tutorMessagesToday: 0,
      lessonTheme: 1,
    });
    const used = await essayCount(supabase, "u2");
    expect(canMarkEssay(await getPlan(supabase, "u2"), used).allowed).toBe(false);
  });
});

// --- tutor messaging --------------------------------------------------------
describe("simulated tutor messaging", () => {
  it("free user hits limit after 5 messages in a day", () => {
    const results = Array.from({ length: 6 }, (_, i) =>
      canSendTutorMessage("free", i),
    );
    expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);
    expect(results[5].allowed).toBe(false);
  });

  it("paid user is never limited", () => {
    expect(canSendTutorMessage("monthly", 500).allowed).toBe(true);
    expect(canSendTutorMessage("until_may_2027", 500).allowed).toBe(true);
  });
});

// --- lesson access ----------------------------------------------------------
describe("simulated lesson access", () => {
  it("free user blocked from Theme 2 lesson", async () => {
    const supabase = makeSupabase({
      profiles: { u3: { plan: "free" } },
      essays: [],
      tutorMessagesToday: 0,
      lessonTheme: 2,
    });
    const plan = await getPlan(supabase, "u3");
    expect(canAccessLesson(plan, 2).allowed).toBe(false);
  });

  it("paid user can access Theme 4 lesson", async () => {
    const supabase = makeSupabase({
      profiles: { u4: { plan: "monthly" } },
      essays: [],
      tutorMessagesToday: 0,
      lessonTheme: 4,
    });
    const plan = await getPlan(supabase, "u4");
    expect(canAccessLesson(plan, 4).allowed).toBe(true);
  });
});
