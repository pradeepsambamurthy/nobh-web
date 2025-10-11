// /src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url  = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "/";

  const store = await cookies();
  // Read either cookie (primary or fallback)
  const code_verifier =
    store.get("__Host-pkce_v")?.value ??
    store.get("pkce_v")?.value ??
    "";

  const DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const CLIENT = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const REDIR  = process.env.NEXT_PUBLIC_REDIRECT_URI;

  if (!code || !code_verifier || !DOMAIN || !CLIENT || !REDIR) {
    return NextResponse.json(
      {
        error: "missing_fields",
        have: {
          code: !!code,
          client_id: !!CLIENT,
          redirect_uri: !!REDIR,
          domain: !!DOMAIN,
          code_verifier: !!code_verifier,
        },
      },
      { status: 400 }
    );
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT,
    code,
    code_verifier,
    redirect_uri: REDIR,
  });

  const tokenResp = await fetch(`${DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = await tokenResp.json().catch(() => null);

  if (!tokenResp.ok) {
    return NextResponse.json(
      { error: "token_exchange_failed", status: tokenResp.status, details: json },
      { status: 400 }
    );
  }

  const { id_token, access_token, refresh_token, expires_in } = (json || {}) as {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const res = NextResponse.redirect(decodeURIComponent(state || "/"), { status: 302 });

  const base = { httpOnly: true as const, secure: true, sameSite: "lax" as const, path: "/" };
  const max  = Math.max(60, Number(expires_in ?? 3600));

  if (id_token)     res.cookies.set("id_token", id_token,         { ...base, maxAge: max });
  if (access_token) res.cookies.set("access_token", access_token, { ...base, maxAge: max });
  if (refresh_token)res.cookies.set("refresh_token", refresh_token,{ ...base, maxAge: 7 * 24 * 60 * 60 });

  // Clear the PKCE cookies after success
  res.cookies.set("__Host-pkce_v", "", { ...base, maxAge: 0, sameSite: "none" });
  res.cookies.set("pkce_v", "",        { ...base, maxAge: 0, sameSite: "none" });

  // Optional convenience flag for your middleware/UI
  res.cookies.set("logged_in", "true", { ...base, httpOnly: false, maxAge: max });

  return res;
}