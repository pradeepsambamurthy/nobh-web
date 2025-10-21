// src/hooks/useAutoRefresh.ts
"use client";

import { useEffect } from "react";

/**
 * Silently refreshes tokens every `intervalMinutes`.
 * - If refresh returns 401, we clear UI cookie and bounce to login with state.
 * - Also tries a refresh when tab becomes visible after being hidden.
 */
export function useAutoRefresh(intervalMinutes = 45) {
  useEffect(() => {
    let stopped = false;

    async function doRefresh(reason: "interval" | "visibility" = "interval") {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        const json = await res
          .json()
          .catch(() => ({ refreshed: false, parseError: true }));

        // Optional: helpful one-shot log
        console.debug(`[refresh:${reason}]`, json);

        if (res.status === 401 || json?.refreshed === false) {
          // Kill any stale "logged_in" helper cookie from UI
          document.cookie =
            "logged_in=; path=/; max-age=0; samesite=lax; secure";

          // Bounce to login and return to current page
          const state = window.location.pathname + window.location.search;
          window.location.href = `/api/auth/start?state=${encodeURIComponent(
            state || "/"
          )}`;
        }
      } catch (err) {
        // Network issue? Log and keep going next interval.
        console.error("[refresh] failed:", err);
      }
    }

    // Run on an interval
    const id = setInterval(() => doRefresh("interval"), intervalMinutes * 60 * 1000);

    // Run when tab becomes visible after being hidden (nice UX)
    const onVis = () => {
      if (!stopped && document.visibilityState === "visible") {
        void doRefresh("visibility");
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intervalMinutes]);
}