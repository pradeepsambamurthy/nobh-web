// src/app/auth/callback/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPkceVerifier, clearPkce } from "@/lib/auth/pkce";
import { COGNITO_DOMAIN, COGNITO_CLIENT_ID, REDIRECT_URI } from "@/lib/auth/config";

function safeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const sp = new URLSearchParams(window.location.search);
      const code = sp.get("code");
      const state = sp.get("state"); // 👈 comes back from Cognito

      if (!code) { alert("No 'code' in URL"); return; }

      let code_verifier: string;
      try {
        code_verifier = getPkceVerifier();
      } catch (e) {
        console.error(e);
        alert("Missing PKCE verifier. Please click Login again from the home page.");
        return;
      }

      try {
        const resp = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            code_verifier,
            redirect_uri: REDIRECT_URI,
            cognito_domain: COGNITO_DOMAIN,
            client_id: COGNITO_CLIENT_ID,
          }),
        });

        const text = await resp.text();
        console.log("[callback] /api/auth/callback status", resp.status, "body:", text);
        if (!resp.ok) { alert("Token exchange failed. See console for details."); return; }

        clearPkce();

        // 👇 prefer state (decoded), fall back to /residents
        const decoded = state ? decodeURIComponent(state) : "/residents";
        const next = safeInternalPath(decoded) ? decoded : "/residents";
        router.replace(next);
      } catch (e) {
        console.error(e);
        alert("Unexpected error during login. Check console.");
      }
    };
    run();
  }, [router]);

  return <main className="p-6">Signing you in...</main>;
}