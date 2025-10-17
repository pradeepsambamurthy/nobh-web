import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildAuthorizeUrl({
  domain, clientId, redirectUri, codeChallenge,
}: { domain: string; clientId: string; redirectUri: string; codeChallenge: string }) {
  const url = new URL(`${domain.replace(/\/$/, "")}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid email phone profile");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function makeVerifierAndUrl() {
  const domain     = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim();
  const clientId   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
  const redirectUri= process.env.NEXT_PUBLIC_REDIRECT_URI?.trim();
  if (!domain || !clientId || !redirectUri) {
    return { error: "missing_fields", domain: !!domain, clientId: !!clientId, redirectUri: !!redirectUri } as const;
  }

  // PKCE: code_verifier + S256 challenge
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = Array.from(bytes, b => b.toString(16).padStart(2,"0")).join("");
  const sha = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(sha)))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

  // store verifier
  const jar = await cookies();
  jar.set("code_verifier", codeVerifier, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV==="production", path: "/", maxAge: 300,
  });

  const authorizeUrl = buildAuthorizeUrl({ domain, clientId, redirectUri, codeChallenge: challenge });
  return { authorizeUrl } as const;
}

export async function GET(req: NextRequest) {
  const ret = await makeVerifierAndUrl();
  if ('error' in ret) return NextResponse.json(ret, { status: 500 });

  // Optional state (return_to) – preserve if present
  const returnTo = req.nextUrl.searchParams.get("return_to") || "/";
  const url = `${ret.authorizeUrl}&state=${encodeURIComponent(returnTo)}`;
  return NextResponse.redirect(url, { status: 302 });
}

export async function POST() {
  const ret = await makeVerifierAndUrl();
  if ('error' in ret) return NextResponse.json(ret, { status: 500 });
  return NextResponse.json(ret);
}