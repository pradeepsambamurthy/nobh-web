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
      const state = sp.get("state");

      console.log("[callback] before read", {
        url: window.location.href,
        localHas: !!localStorage.getItem("pkce_code_verifier"),
      });

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
        console.log("[callback] token exchange status", resp.status, "body:", text);
        if (!resp.ok) { alert("Token exchange failed. See console."); return; }

        clearPkce();

        const decoded = state ? decodeURIComponent(state) : "/residents";
        router.replace(safeInternalPath(decoded) ? decoded : "/residents");
      } catch (e) {
        console.error(e);
        alert("Unexpected error during login. Check console.");
      }
    };
    run();
  }, [router]);

  return <main className="p-6">Signing you in...</main>;
}