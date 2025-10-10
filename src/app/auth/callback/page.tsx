"use client";

export const dynamic = "force-dynamic";      // disable static generation
export const runtime = "nodejs";             // ensure server runtime, not edge
export const revalidate = 0;                 // no ISR attempt

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI!;

function CallbackInner() {
  const router = useRouter();
  const qp = useSearchParams();
  const fired = useRef(false);
  const code = qp.get("code");
  const error = qp.get("error");
  const errorDesc = qp.get("error_description") ?? "";
  const state = qp.get("state");
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (error) {
      setMsg(`Sign-in failed: ${decodeURIComponent(errorDesc) || error}`);
      return;
    }

    if (!code) {
      setMsg("No authorization code found in the URL.");
      return;
    }

    (async () => {
      try {
        setMsg("Exchanging code for tokens…");
        const resp = await fetch("/api/auth/callback", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: REDIRECT_URI,
            cognito_domain: COGNITO_DOMAIN,
            client_id: CLIENT_ID,
          }),
        });

        if (!resp.ok) {
          const detail = await resp.json().catch(() => ({}));
          console.error("[callback] token exchange failed", detail);
          setMsg(`Token exchange failed (${resp.status}).`);
          return;
        }

        const next = state ? decodeURIComponent(state) : "/";
        setMsg("Signed in! Redirecting…");
        router.replace(next);
      } catch (e) {
        console.error("[callback] unexpected", e);
        setMsg("Unexpected error during sign-in.");
      }
    })();
  }, [code, error, errorDesc, router, state]);

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">NoBrokerHood+ Admin</h1>
        <p className="text-gray-600">{msg}</p>
      </div>
    </main>
  );
}

// ✅ Wrap in Suspense — required by React 19
export default function CallbackPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading…</p>}>
      <CallbackInner />
    </Suspense>
  );
}