import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  return POST();
}

export async function POST() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN; // no trailing slash
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Generate PKCE code_verifier + S256 code_challenge
  const rand = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = Array.from(rand, b => b.toString(16).padStart(2, "0")).join("");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  // Store verifier as httpOnly cookie
  (await cookies()).set({
    name: "code_verifier",
    value: codeVerifier,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5, // 5 minutes
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

  // ⬇️ Redirect instead of returning JSON
  return NextResponse.redirect(authorizeUrl, { status: 302 });
}