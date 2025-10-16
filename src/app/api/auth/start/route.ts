// app/api/auth/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { cookieOptionsForEnv } from "@/lib/cookieOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function b64url(buf: Buffer | Uint8Array) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export async function GET(req: NextRequest) {
  const DOMAIN   = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim()!;
  const CLIENT   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim()!;
  const REDIRECT = process.env.NEXT_PUBLIC_REDIRECT_URI?.trim()!;
  const SCOPES   = "openid email profile";

  if (!DOMAIN || !CLIENT || !REDIRECT) {
    return NextResponse.json({ error: "env_missing" }, { status: 500 });
  }

  // PKCE
  const verifier  = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  // state from return_to (default /residents)
  const url = new URL(req.url);
  const wanted = url.searchParams.get("return_to");
  const state = isSafeInternalPath(wanted) ? wanted! : "/residents";

  // Cognito authorize URL
  const authorize = new URL(`${DOMAIN.replace(/\/$/, "")}/oauth2/authorize`);
  authorize.searchParams.set("client_id", CLIENT);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("redirect_uri", REDIRECT);
  authorize.searchParams.set("scope", SCOPES);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  authorize.searchParams.set("state", state); // do NOT pre-encode

  const res = NextResponse.redirect(authorize.toString(), { status: 302 });

  // Cookie that survives the round-trip
  const common = cookieOptionsForEnv(); // Secure=false on localhost, Secure=true on Vercel
  res.cookies.set("pkce_v", verifier, common);
  if (common.secure) res.cookies.set("__Host-pkce_v", verifier, common);

  return res;
}

// Also support POST (optional, but handy)
export const POST = GET;