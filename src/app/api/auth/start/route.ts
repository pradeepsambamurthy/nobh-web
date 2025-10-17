import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime so Buffer is available

export async function POST() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // PKCE: code_verifier
  const random = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = Array.from(random, b => b.toString(16).padStart(2, "0")).join("");

  // SHA-256 -> base64url(code_challenge)
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier)
  );
  const codeChallenge = Buffer.from(new Uint8Array(digest))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

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

  // ⬇️ Set the cookie on the response (works in all runtimes)
  const res = NextResponse.json({ authorizeUrl });
  res.cookies.set({
    name: "code_verifier",
    value: codeVerifier,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5, // 5 minutes
  });
  return res;
}

// Optional: allow manual GET testing
export async function GET() {
  return POST();
}