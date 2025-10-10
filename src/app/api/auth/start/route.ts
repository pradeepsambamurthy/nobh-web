import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const b64url = (b: Buffer | Uint8Array) =>
  Buffer.from(b).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");

export async function GET() {
  const DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const CLIENT = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const REDIR  = process.env.NEXT_PUBLIC_REDIRECT_URI!;
  if (!DOMAIN || !CLIENT || !REDIR) {
    return NextResponse.json({ error: "env_missing" }, { status: 500 });
  }

  // PKCE
  const verifier  = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  // Build authorize URL
  const auth = new URL(`${DOMAIN.replace(/\/$/, "")}/oauth2/authorize`);
  auth.searchParams.set("client_id", CLIENT);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("redirect_uri", REDIR);
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");
  auth.searchParams.set("state", encodeURIComponent("/residents"));

  // Set PKCE verifier cookie (must be cross-site friendly)
  const res = NextResponse.redirect(auth.toString(), { status: 302 });
  res.cookies.set("pkce_v", verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "none",   // <-- critical for IdP redirect
    path: "/",
    maxAge: 15 * 60,
  });
  return res;
}

export async function POST() { return GET(); }