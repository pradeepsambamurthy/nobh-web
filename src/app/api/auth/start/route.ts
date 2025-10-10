import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function b64url(buf: Buffer | Uint8Array) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function POST() {
  const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI!;
  const SCOPES         = "openid email profile";

  if (!COGNITO_DOMAIN || !CLIENT_ID || !REDIRECT_URI) {
    return NextResponse.json({ error: "env_missing" }, { status: 500 });
  }

  // PKCE verifier + challenge
  const verifier  = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  // Build the Cognito authorize URL (ALL required params present)
  const url = new URL(`${COGNITO_DOMAIN.replace(/\/$/, "")}/oauth2/authorize`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", encodeURIComponent("/residents"));

  // Prepare response JSON
  const res = NextResponse.json({ authorizeUrl: url.toString() });

  // One-time PKCE cookie (read later in callback)
  res.cookies.set("pkce_v", verifier, {
    httpOnly: true,
    sameSite: "lax",   // allows top-level nav back from Cognito
    secure: !!process.env.VERCEL, // true on Vercel
    path: "/",
    maxAge: 300,       // 5 minutes
  });

  return res;
}