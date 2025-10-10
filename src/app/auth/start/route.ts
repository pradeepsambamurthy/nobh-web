// src/app/api/auth/start/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

function b64url(bytes: Uint8Array | ArrayBuffer) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Buffer.from(u8).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function GET()  { return make(); }
export async function POST() { return make(); }

async function make() {
  const domain      = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const clientId    = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;
  const scopes      = "openid email profile";

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json({ error: "missing_env" }, { status: 500 });
  }

  // PKCE
  const rand = new Uint8Array(32);
  crypto.getRandomValues(rand);
  const verifier  = b64url(rand);
  const digest    = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = b64url(digest);

  // Location to Cognito
  const url = new URL(`${domain}/oauth2/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", encodeURIComponent("/residents"));

  // Set `pkce_v` on the SAME response you return
  const res = NextResponse.redirect(url.toString(), { status: 302 });
  res.cookies.set("pkce_v", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 300,
  });

  return res;
}