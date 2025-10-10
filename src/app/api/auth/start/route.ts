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

export async function GET() {
  const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI!;
  const SCOPES         = "openid email profile";

  if (!COGNITO_DOMAIN || !CLIENT_ID || !REDIRECT_URI) {
    console.error("[auth/start] Missing env vars");
    return NextResponse.json({ error: "env_missing" }, { status: 500 });
  }

  // Generate PKCE verifier & challenge
  const verifier  = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  // Build Cognito authorize URL
  const authUrl = new URL(`${COGNITO_DOMAIN.replace(/\/$/, "")}/oauth2/authorize`);
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", encodeURIComponent("/residents"));

  // Force secure cookie base
  const cookieBase = {
    httpOnly: true as const,
    sameSite: "none" as const,   
    secure: true,                
    path: "/",
    maxAge: 900,                 
  };

  // Create redirect response
  const res = NextResponse.redirect(authUrl.toString(), { status: 302 });
  res.cookies.set("pkce_v", verifier, cookieBase);

  console.log("[auth/start] PKCE cookie set:", verifier.slice(0, 8) + "...");

  return res;
}

export async function POST() {
  return GET();
}