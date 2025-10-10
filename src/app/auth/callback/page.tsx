"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI!;

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const sp = new URLSearchParams(window.location.search);
      const code  = sp.get("code");
      const state = sp.get("state");

      if (!code) {
        alert("No authorization code in URL.");
        return;
      }

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

      const text = await r.text();
      if (!r.ok) {
        console.error("[callback] token exchange failed", r.status, text);
        alert("Token exchange failed. See console.");
        return;
      }

      // success -> go where state asked, else /residents
      const dest = state ? decodeURIComponent(state) : "/residents";
      router.replace(dest.startsWith("/") && !dest.startsWith("//") ? dest : "/residents");
    };

    run();
  }, [router]);

  return <main className="p-6">Signing you in…</main>;
}