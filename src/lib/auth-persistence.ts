import { supabase } from "@/integrations/supabase/client";

const REMEMBER_KEY = "auth.remember";
const TAB_ALIVE_KEY = "auth.tab-alive";
const CHANNEL_NAME = "auth.alive-channel";
const PEER_WAIT_MS = 250;

/**
 * Call right after a successful sign-in to record the user's "Remember me" choice.
 * - true  → session persists across browser restarts (Supabase default).
 * - false → session is treated as browser-session-scoped; cleared once every tab
 *           of this origin is closed and the browser is fully relaunched.
 */
export function setRememberMe(remember: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
    if (!remember) sessionStorage.setItem(TAB_ALIVE_KEY, "1");
    else sessionStorage.removeItem(TAB_ALIVE_KEY);
  } catch {
    /* storage unavailable; ignore */
  }
}

function hasLivePeer(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof BroadcastChannel === "undefined") {
      resolve(false);
      return;
    }
    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      resolve(false);
      return;
    }
    let done = false;
    const finish = (alive: boolean) => {
      if (done) return;
      done = true;
      try {
        channel.close();
      } catch {
        /* ignore */
      }
      resolve(alive);
    };
    channel.onmessage = (e) => {
      if (e.data === "pong") finish(true);
    };
    try {
      channel.postMessage("ping");
    } catch {
      finish(false);
      return;
    }
    setTimeout(() => finish(false), PEER_WAIT_MS);
  });
}

function startPeerResponder() {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (e) => {
      if (e.data === "ping") {
        try {
          channel.postMessage("pong");
        } catch {
          /* ignore */
        }
      }
    };
  } catch {
    /* ignore */
  }
}

/**
 * Run once on app boot (client-only). For "don't remember me" users, decide whether
 * this is a fresh browser session — if no other tab of the app is alive AND this tab
 * has no sessionStorage marker, treat it as a browser relaunch and sign out.
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

  // Always listen for peer probes so OTHER tabs can detect we're alive.
  startPeerResponder();

  if (remember !== "false") return;

  // Same tab as the original login (or a reload of it) — keep session.
  if (tabAlive) return;

  // New tab. If any other tab of this origin answers, the browser session is
  // still alive — inherit the live state and mark this tab alive too.
  const peerAlive = await hasLivePeer();
  if (peerAlive) {
    try {
      sessionStorage.setItem(TAB_ALIVE_KEY, "1");
    } catch {
      /* ignore */
    }
    return;
  }

  // No peer + no marker → browser was relaunched. Sign out.
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
}
