"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI!;

export default function AuthCallback() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;          // guard against double run in Strict Mode
    ran.current = true;

    (async () => {
      const sp = new URLSearchParams(window.location.search);
      const code  = sp.get("code");
      const state = sp.get("state") ?? "";

      if (!code) {
        alert("No authorization code in URL.");
        return;
      }

      // Prevent reuse on reload/back: strip query immediately and mark in session
      try {
        const key = `handled_code:${code}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {}
      window.history.replaceState({}, "", window.location.origin + window.location.pathname);

      const r = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          code,
          redirect_uri: REDIRECT_URI,
          cognito_domain: COGNITO_DOMAIN,
          client_id: CLIENT_ID,
        }),
      });

      const text = await r.text().catch(() => "");
      if (!r.ok) {
        console.error("[callback] token exchange failed", r.status, text);
        // If cookies were already set by a previous attempt, just continue.
        try {
          const hasId = document.cookie.includes("id_token=");
          if (hasId) {
            const dest = state ? decodeURIComponent(state) : "/residents";
            router.replace(dest.startsWith("/") && !dest.startsWith("//") ? dest : "/residents");
            return;
          }
        } catch {}
        alert("Token exchange failed. See console.");
        return;
      }

      const dest = state ? decodeURIComponent(state) : "/residents";
      router.replace(dest.startsWith("/") && !dest.startsWith("//") ? dest : "/residents");
    })();
  }, [router]);

  return <main className="p-6">Signing you in…</main>;
}