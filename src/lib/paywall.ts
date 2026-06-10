// Pure paywall predicates shared by server functions and client gating.
// Kept dependency-free so they can be unit-tested without any I/O.

export const ESSAY_FREE_LIFETIME_LIMIT = 1;
export const ESSAY_MONTHLY_PLAN_LIMIT = 10;
export const TUTOR_FREE_DAILY_LIMIT = 5;
export const FREE_THEME_MAX = 1; // free tier covers Theme 1 only

export type Plan = "free" | "monthly" | "until_2027" | "until_2028" | string;

export type GateResult =
  | { allowed: true; remaining: number | null }
  | { allowed: false; reason: string; upgrade: true };

export function canMarkEssay(plan: Plan, usedCount: number): GateResult {
  if (plan === "free") {
    if (usedCount >= ESSAY_FREE_LIFETIME_LIMIT) {
      return {
        allowed: false,
        reason: "You've used your 1 free essay mark. Upgrade for unlimited essay marking.",
        upgrade: true,
      };
    }
    return { allowed: true, remaining: 0 };
  }
  if (plan === "monthly") {
    if (usedCount >= ESSAY_MONTHLY_PLAN_LIMIT) {
      return {
        allowed: false,
        reason: "You've used all 10 essay marks this month",
        upgrade: true,
      };
    }
    return { allowed: true, remaining: ESSAY_MONTHLY_PLAN_LIMIT - usedCount - 1 };
  }
  // Premium / unlimited tiers
  return { allowed: true, remaining: null };
}

export function canSendTutorMessage(plan: Plan, usedToday: number): GateResult {
  if (plan === "free") {
    if (usedToday >= TUTOR_FREE_DAILY_LIMIT) {
      return {
        allowed: false,
        reason: "You've used your 5 free messages for today. Upgrade for unlimited.",
        upgrade: true,
      };
    }
    return { allowed: true, remaining: TUTOR_FREE_DAILY_LIMIT - usedToday - 1 };
  }
  return { allowed: true, remaining: null };
}

export function canAccessLesson(plan: Plan, themeNumber: number): GateResult {
  if (plan === "free" && themeNumber > FREE_THEME_MAX) {
    return {
      allowed: false,
      reason: `Free access covers Theme ${FREE_THEME_MAX}. Upgrade to unlock all themes.`,
      upgrade: true,
    };
  }
  return { allowed: true, remaining: null };
}
