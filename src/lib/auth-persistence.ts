import { supabase } from "@/integrations/supabase/client";

const REMEMBER_KEY = "auth.remember";
const TAB_ALIVE_KEY = "auth.tab-alive";

/**
 * Call right after a successful sign-in to record the user's "Remember me" choice.
 * - remember = true  → session persists across browser restarts (default Supabase behavior).
 * - remember = false → session is treated as tab-scoped; cleared on next browser launch.
 */
export function setRememberMe(remember: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
    if (!remember) sessionStorage.setItem(TAB_ALIVE_KEY, "1");
    else sessionStorage.removeItem(TAB_ALIVE_KEY);
  } catch {
    /* storage may be unavailable; ignore */
  }
}

/**
 * Run once on app boot (client-only). If the user chose "don't remember me" and the
 * sessionStorage marker is gone (new browser session / closed-and-reopened), sign out.
 * Otherwise refresh the tab marker so it survives reloads within the same browser session.
 */
export async function enforceSessionPersistence() {
  if (typeof window === "undefined") return;
  let remember: string | null = null;
  let tabAlive: string | null = null;
  try {
    remember = localStorage.getItem(REMEMBER_KEY);
    tabAlive = sessionStorage.getItem(TAB_ALIVE_KEY);
  } catch {
    return;
  }

  if (remember === "false" && !tabAlive) {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  if (remember === "false") {
    try {
      sessionStorage.setItem(TAB_ALIVE_KEY, "1");
    } catch {
      /* ignore */
    }
  }
}
