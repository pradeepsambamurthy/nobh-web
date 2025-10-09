"use client";
import { createPkcePair } from "@/lib/auth/pkce";
import { COGNITO_CLIENT_ID, COGNITO_DOMAIN, OAUTH_SCOPES, REDIRECT_URI } from "@/lib/auth/config";

export default function Home() {
  const login = async () => {
    // Generate PKCE
    const { verifier, challenge } = await createPkcePair();

    // Optional: carry return path (default /residents)
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("return_to") ?? "/residents";

    const url = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
    url.searchParams.set("client_id", COGNITO_CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", OAUTH_SCOPES);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("state", encodeURIComponent(returnTo));

    // Debug log before leaving the page
    console.log("[login] set verifier len =", verifier.length, {
      href: window.location.href,
      localHas: !!localStorage.getItem("pkce_code_verifier"),
      redirectTo: url.toString(),
    });

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