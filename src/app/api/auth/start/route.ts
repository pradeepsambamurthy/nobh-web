// src/app/api/auth/start/route.ts
import { NextRequest, NextResponse } from "next/server";
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

export async function GET(_req: NextRequest) {
  const DOMAIN   = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const CLIENT   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const REDIRECT = process.env.NEXT_PUBLIC_REDIRECT_URI!;
  const SCOPES   = "openid email profile";

  if (!DOMAIN || !CLIENT || !REDIRECT) {
    return NextResponse.json({ error: "env_missing" }, { status: 500 });
  }

  // PKCE
  const verifier  = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  // AWS Cognito authorize URL
  const authorize = new URL(`${DOMAIN.replace(/\/$/, "")}/oauth2/authorize`);
  authorize.searchParams.set("client_id", CLIENT);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("redirect_uri", REDIRECT);
  authorize.searchParams.set("scope", SCOPES);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  authorize.searchParams.set("state", encodeURIComponent("/residents"));

  // Redirect back to Cognito
  const res = NextResponse.redirect(authorize.toString(), { status: 302 });

  // Set a host-only, secure cookie. SameSite=Lax is correct for top-level navigations.
  // Use __Host- prefix for extra safety (requires Secure, path=/, and NO Domain attr).
  res.cookies.set("__Host-pkce_v", verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  console.log("[auth/start] set __Host-pkce_v (len=%d)", verifier.length);
  return res;
}

export async function POST(req: NextRequest) {
  return GET(req);
}