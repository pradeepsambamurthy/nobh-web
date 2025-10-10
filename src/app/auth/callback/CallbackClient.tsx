// app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CallbackClient(props: {
  code: string;
  error: string;
  error_description: string;
  state: string;
}) {
  const { code, error, error_description, state } = props;
  const router = useRouter();
  const fired = useRef(false);
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // 1) Strip query ASAP so rehydration doesn't retrigger
    try { window.history.replaceState({}, "", "/auth/callback"); } catch {}

    // 2) Handle error or missing code
    if (error) {
      setMsg(`Sign-in failed: ${decodeURIComponent(error_description) || error}`);
      return;
    }
    if (!code) {
      setMsg("No authorization code found in the URL.");
      return;
    }

    // 3) Exchange exactly once
    (async () => {
      try {
        setMsg("Exchanging code for tokens…");
        const resp = await fetch("/api/auth/callback", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }), // only send code
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          console.error("[callback] token exchange failed", data);
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
  }, []); // ✅ run once

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">NoBrokerHood+ Admin</h1>
        <p className="text-gray-600">{msg}</p>
      </div>
    </main>
  );
}