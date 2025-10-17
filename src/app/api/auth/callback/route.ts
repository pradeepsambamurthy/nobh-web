// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(res: any, status = 400) {
  return NextResponse.json(res, { status });
}

export async function GET(req: NextRequest) {
  const domain     = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const clientId   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
  const redirectUri= process.env.NEXT_PUBLIC_REDIRECT_URI?.trim();

  if (!domain || !clientId || !redirectUri) {
    return json({ error: "missing_env" }, 500);
  }

  const url  = new URL(req.url);
  const code = url.searchParams.get("code");
  const state= url.searchParams.get("state") || "/";

  if (!code) return json({ error: "missing_code" }, 400);

  const jar = await cookies();
  const codeVerifier = jar.get("code_verifier")?.value;
  if (!codeVerifier) return json({ error: "missing_code_verifier" }, 400);

  // Exchange code → tokens
  const tokenUrl = `${domain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  const tokRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payload = await tokRes.json().catch(() => ({} as any));
  if (!tokRes.ok) {
    return json({ error: "token_exchange_failed", details: payload }, 401);
  }

  const {
    access_token,
    id_token,
    refresh_token,
    expires_in = 3600,
  } = payload as {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const secure = process.env.NODE_ENV === "production";
  const base = { httpOnly: true as const, sameSite: "lax" as const, secure, path: "/" };

  // Set cookies for API routes to forward as Bearer
  jar.set("access_token", access_token, { ...base, maxAge: expires_in });
  jar.set("id_token",     id_token,     { ...base, maxAge: expires_in });
  if (refresh_token) jar.set("refresh_token", refresh_token, { ...base, maxAge: 30 * 24 * 3600 });

  // Clear one-time verifier + set a non-HTTP-only “logged_in” hint for the UI
  jar.set("code_verifier", "", { ...base, maxAge: 0 });
  jar.set("logged_in", "1", { path: "/", sameSite: "lax", secure, httpOnly: false, maxAge: 7 * 24 * 3600 });

  return NextResponse.redirect(state, { headers: { "Cache-Control": "no-store" } });
}