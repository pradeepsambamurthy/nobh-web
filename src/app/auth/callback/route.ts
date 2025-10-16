// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TokenJson = {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const rawState = url.searchParams.get("state") || "/";

  const DOMAIN   = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const CLIENT   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const REDIRECT = process.env.NEXT_PUBLIC_REDIRECT_URI;

  if (!DOMAIN || !CLIENT || !REDIRECT) {
    return NextResponse.json(
      { error: "env_missing", have: { DOMAIN: !!DOMAIN, CLIENT: !!CLIENT, REDIRECT: !!REDIRECT } },
      { status: 500 }
    );
  }
  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

  const jar = await cookies();
  const code_verifier = jar.get("__Host-pkce_v")?.value ?? jar.get("pkce_v")?.value ?? "";
  if (!code_verifier) {
    return NextResponse.json(
      { error: "missing_pkce_cookie", tip: "Begin login from the same domain as callback (nobh-web.vercel.app), not localhost." },
      { status: 400 }
    );
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT,
    code,
    code_verifier,
    redirect_uri: REDIRECT,
  });

  const resp = await fetch(`${DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = (await resp.json().catch(() => ({}))) as TokenJson;
  if (!resp.ok) {
    return NextResponse.json(
      { error: "token_exchange_failed", status: resp.status, details: json },
      { status: 400 }
    );
  }

  const nextPath = rawState.startsWith("/") ? rawState : "/";
  const dest = new URL(nextPath, url.origin); // ABSOLUTE URL (required on Vercel)

  const base = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  const max = Math.max(60, Number(json.expires_in ?? 3600));

  const res = NextResponse.redirect(dest.toString(), { status: 302 });
  if (json.id_token)     res.cookies.set("id_token", json.id_token, { ...base, maxAge: max });
  if (json.access_token) res.cookies.set("access_token", json.access_token, { ...base, maxAge: max });
  if (json.refresh_token)res.cookies.set("refresh_token", json.refresh_token, { ...base, maxAge: 7 * 24 * 60 * 60 });

  // clear one-time PKCE cookies
  res.cookies.set("pkce_v", "", { ...base, maxAge: 0 });
  if (base.secure) res.cookies.set("__Host-pkce_v", "", { ...base, maxAge: 0 });

  // optional UI hint
  res.cookies.set("logged_in", "true", { httpOnly: false, secure: base.secure, sameSite: "lax", path: "/", maxAge: max });

  return res;
}