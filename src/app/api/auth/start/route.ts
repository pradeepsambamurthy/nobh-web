import { NextResponse } from "next/server";

function toBase64Url(bytes: Uint8Array) {
  // base64url without padding
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function POST() {
  const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI!;
  const SCOPES         = "openid email profile";

  if (!COGNITO_DOMAIN || !CLIENT_ID || !REDIRECT_URI) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // 1) PKCE verifier (random) and challenge (SHA-256)
  const rand = new Uint8Array(32);
  crypto.getRandomValues(rand);
  const verifier = toBase64Url(rand);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = toBase64Url(new Uint8Array(digest));

  // 2) Build Cognito authorize URL
  const url = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", encodeURIComponent("/residents"));

  // 3) Set verifier cookie on the SAME response you return
  const res = NextResponse.redirect(url.toString(), { status: 302 });
  res.cookies.set({
    name: "pkce_v",
    value: verifier,
    httpOnly: true,
    sameSite: "lax",      // use "none" only if you absolutely need cross-site
    secure: true,         // true on Vercel/HTTPS
    path: "/",
    maxAge: 300,          // 5 minutes
  });

  return res;
}