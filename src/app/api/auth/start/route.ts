import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // generate code_verifier & code_challenge
  const random = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = Array.from(random, b => b.toString(16).padStart(2, "0")).join("");
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier)))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // store verifier in secure httpOnly cookie
  (await cookies()).set({
    name: "code_verifier",
    value: codeVerifier,
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
    maxAge: 300, // 5 min
  });

  const authorizeUrl =
    `${domain}/oauth2/authorize?` +
    new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "openid email phone profile",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString();

  return NextResponse.json({ authorizeUrl });
}