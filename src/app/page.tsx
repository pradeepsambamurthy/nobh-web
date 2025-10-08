"use client";

import { createPkcePair } from "@/lib/auth/pkce";
import { COGNITO_CLIENT_ID, COGNITO_DOMAIN, OAUTH_SCOPES, REDIRECT_URI } from "@/lib/auth/config";

export default function Home() {
  const login = async () => {
    if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID || !REDIRECT_URI) {
      alert("Missing Cognito env vars. Check .env.local and restart `pnpm dev`.");
      return;
    }

    const { challenge } = await createPkcePair();
    console.log("[login] session pkce:", sessionStorage.getItem("pkce_verifier"));
    console.log("[login] local pkce:", localStorage.getItem("pkce_verifier"));

    const domain = COGNITO_DOMAIN.replace(/\/$/, "");
    const url = new URL(`${domain}/oauth2/authorize`);
    url.searchParams.set("client_id", COGNITO_CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", OAUTH_SCOPES);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");

    console.log("[login] redirecting to:", url.toString());
    await new Promise((r) => setTimeout(r, 500));
    window.location.href = url.toString();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">NoBrokerHood+ Admin</h1>
      <button className="rounded-lg bg-blue-600 px-6 py-3 text-white" onClick={login}>
        Login with AWS Cognito
      </button>
    </main>
  );
}