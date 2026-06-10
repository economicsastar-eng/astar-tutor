import { describe, it, expect } from "vitest";
import {
  canMarkEssay,
  canSendTutorMessage,
  canAccessLesson,
  ESSAY_FREE_LIFETIME_LIMIT,
  TUTOR_FREE_DAILY_LIMIT,
} from "@/lib/paywall";

describe("Essay marker paywall — free vs paid", () => {
  it("allows a free user their 1 lifetime essay", () => {
    const r = canMarkEssay("free", 0);
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.remaining).toBe(0);
  });

  it("blocks a free user after their 1 lifetime essay", () => {
    const r = canMarkEssay("free", ESSAY_FREE_LIFETIME_LIMIT);
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.upgrade).toBe(true);
      expect(r.reason).toMatch(/1 free essay/i);
    }
  });

  it("allows a monthly user up to 10 essays per month", () => {
    const r = canMarkEssay("monthly", 9);
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.remaining).toBe(0);
  });

  it("blocks a monthly user after 10 essays", () => {
    const r = canMarkEssay("monthly", 10);
    expect(r.allowed).toBe(false);
  });

  it("gives unlimited (null remaining) to premium tiers", () => {
    const r = canMarkEssay("until_may_2027", 999);
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.remaining).toBeNull();
  });
});

describe("Tutor messaging paywall — free vs paid", () => {
  it("allows a free user up to 5 messages per day", () => {
    for (let used = 0; used < TUTOR_FREE_DAILY_LIMIT; used++) {
      const r = canSendTutorMessage("free", used);
      expect(r.allowed).toBe(true);
      if (r.allowed) expect(r.remaining).toBe(TUTOR_FREE_DAILY_LIMIT - used - 1);
    }
  });

  it("blocks the 6th message of the day for a free user", () => {
    const r = canSendTutorMessage("free", TUTOR_FREE_DAILY_LIMIT);
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.upgrade).toBe(true);
      expect(r.reason).toMatch(/5 free messages/i);
    }
  });

  it("does not limit paid users", () => {
    const r = canSendTutorMessage("monthly", 9999);
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.remaining).toBeNull();
  });
});

describe("Lesson access paywall — theme gating", () => {
  it("lets free users access Theme 1", () => {
    expect(canAccessLesson("free", 1).allowed).toBe(true);
  });

  it.each([2, 3, 4])("blocks free users from Theme %i", (theme) => {
    const r = canAccessLesson("free", theme);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.upgrade).toBe(true);
  });

  it.each([1, 2, 3, 4])("lets paid users access Theme %i", (theme) => {
    expect(canAccessLesson("monthly", theme).allowed).toBe(true);
    expect(canAccessLesson("until_may_2027", theme).allowed).toBe(true);
  });
});
