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

  // use a single param name from middleware: return_to
  const returnTo = req.nextUrl.searchParams.get("return_to") || "/";

  const authorizeUrl = buildAuthorizeUrl(domain, clientId, redirectUri, challenge);
  const location = `${authorizeUrl}&state=${encodeURIComponent(returnTo)}`;

  // helpful one-shot log while stabilizing
  console.log("[/auth/start]", {
    domain, clientId: clientId.slice(0,4) + "…",
    redirectUri, state: returnTo,
    challenge_len: challenge.length, verifier_len: verifier.length,
  });

  const res = NextResponse.redirect(location, { status: 302 });
  res.headers.set("Cache-Control", "no-store");

  const isHttps = req.nextUrl.protocol === "https:";
  if (isHttps) {
    // __Host- cookie (https only)
    res.cookies.set("__Host-code_verifier", verifier, {
      httpOnly: true,
      sameSite: "lax",  // Lax is enough; cookie is same-site for the callback
      secure: true,
      path: "/",
      maxAge: 300,
    });
  } else {
    // localhost dev
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