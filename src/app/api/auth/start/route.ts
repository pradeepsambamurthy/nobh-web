import { NextRequest, NextResponse } from "next/server";
import { makePkce } from "./pkce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildAuthorizeUrl(domain: string, clientId: string, redirectUri: string, codeChallenge: string) {
  const url = new URL(`${domain.replace(/\/$/, "")}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid email phone profile");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function GET(req: NextRequest) {
  const domain     = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim();
  const clientId   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
  const redirectUri= process.env.NEXT_PUBLIC_REDIRECT_URI?.trim();

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json(
      { error: "missing_env", have: { domain: !!domain, clientId: !!clientId, redirectUri: !!redirectUri } },
      { status: 500 }
    );
  }

  // PKCE pair
  const { verifier, challenge } = await makePkce();

  // Where to return after login
  const returnTo = req.nextUrl.searchParams.get("return_to") || "/";

  const authorizeUrl = buildAuthorizeUrl(domain, clientId, redirectUri, challenge);
  const location = `${authorizeUrl}&state=${encodeURIComponent(returnTo)}`;

  // Set the verifier cookie (use __Host- in prod)
  const res = NextResponse.redirect(location, { status: 302 });
  res.headers.set("Cache-Control", "no-store");

  const isHttps = req.nextUrl.protocol === "https:"; // Vercel prod is https
  const name = isHttps ? "__Host-code_verifier" : "code_verifier";
  res.cookies.set(name, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,       // __Host- requires secure+path=/
    path: "/",
    maxAge: 300,
  });

  return res;
}