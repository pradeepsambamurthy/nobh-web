import { NextRequest, NextResponse } from "next/server";
import { makePkce } from "./pkce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildAuthorizeUrl(domain: string, clientId: string, redirectUri: string, codeChallenge: string) {
  const url = new URL(`${domain.replace(/\/$/, "")}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid email profile"); // phone not needed unless you use it
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// ...imports unchanged

export async function GET(req: NextRequest) {
  const domain      = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim();
  const clientId    = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI?.trim();
  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json(
      { error: "missing_env", have: { domain: !!domain, clientId: !!clientId, redirectUri: !!redirectUri } },
      { status: 500 }
    );
  }

  const { verifier, challenge } = await makePkce();

  // ✅ Accept both, prefer `state`
  const state =
    req.nextUrl.searchParams.get("state") ??
    req.nextUrl.searchParams.get("return_to") ??
    "/";

  const authorizeUrl = new URL(`${domain.replace(/\/$/, "")}/oauth2/authorize`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
  res.headers.set("Cache-Control", "no-store");

  // ✅ keep the verifier cookie same-site; callback is same-origin
  const isHttps = req.nextUrl.protocol === "https:";
  if (isHttps) {
    res.cookies.set("__Host-code_verifier", verifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 300,
    });
  } else {
    res.cookies.set("code_verifier", verifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 300,
    });
  }

  return res;
}