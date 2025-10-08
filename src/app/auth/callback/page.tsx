// app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPkceVerifier, clearPkce } from "@/lib/auth/pkce";
import { COGNITO_DOMAIN, COGNITO_CLIENT_ID, REDIRECT_URI } from "@/lib/auth/config";

export default function AuthCallback() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("Signing you in...");

  useEffect(() => {
    const run = async () => {
      const code = sp.get("code");
      if (!code) {
        setMsg("No 'code' in URL");
        alert("No 'code' in URL");
        return;
      }

      let code_verifier: string;
      try {
        code_verifier = getPkceVerifier(); // from sessionStorage
      } catch (e) {
        console.error(e);
        setMsg("Missing PKCE verifier. Please click Login again from the home page.");
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

        if (!resp.ok) {
          setMsg("Token exchange failed. See console for details.");
          alert("Token exchange failed. See console for details.");
          return;
        }

        // success — cookies were set by the API route
        clearPkce();

        // figure out where to go next
        const returnTo =
          // from middleware-added URL param (/?return_to=/residents)
          sp.get("return_to") ||
          // or from your pre-login stash, if you saved it
          sessionStorage.getItem("return_to") ||
          // default
          "/residents";

        sessionStorage.removeItem("return_to");
        router.replace(returnTo);
      } catch (e) {
        console.error(e);
        setMsg("Unexpected error during login. Check console.");
        alert("Unexpected error during login. Check console.");
      }
    };

    run();
  }, [sp, router]);

  return <main className="p-6">{msg}</main>;
}