import { useEffect } from "react";
import { api } from "@/lib/api";

const HEARTBEAT_MS = 30_000;

/**
 * Presence heartbeat: while enabled (authenticated) and the tab is visible, ping
 * the backend every ~30s so it can track concurrent users + per-user active time.
 * Best-effort — failures are swallowed. Pauses when the tab is hidden and pings
 * immediately when it becomes visible again so active time resumes promptly.
 */
export function useHeartbeat(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const ping = () => {
      if (document.visibilityState !== "visible") return;
      api<void>("/me/heartbeat", { method: "POST" }).catch(() => {});
    };

    ping(); // count from mount
    const id = window.setInterval(ping, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", ping);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [enabled]);
}
