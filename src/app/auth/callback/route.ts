// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toForm(data: Record<string, string>) {
  const body = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => body.append(k, v));
  return body;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const returnTo = url.searchParams.get("state") || "/";

  const domain    = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const clientId  = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirect  = process.env.NEXT_PUBLIC_REDIRECT_URI;

  const jar = await cookies();
  const codeVerifier = jar.get("code_verifier")?.value || "";

  const have = {
    domain: !!domain,
    client_id: !!clientId,
    redirect_uri: !!redirect,
    code_verifier: !!codeVerifier,
  };
  if (!code || !have.domain || !have.client_id || !have.redirect_uri || !have.code_verifier) {
    return NextResponse.json({ error: "missing_fields", have }, { status: 400 });
  }

  // Exchange auth code for tokens
  const tokenUrl = `${domain}/oauth2/token`;
  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: toForm({
      grant_type: "authorization_code",
      client_id: clientId!,
      code,
      redirect_uri: redirect!,
      code_verifier: codeVerifier,
    }),
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: "token_exchange_failed", details: text }, { status: 502 });
  }

  const json = await resp.json() as {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };

  // Set auth cookies
  const secure = process.env.NODE_ENV === "production";
  const base = { httpOnly: true as const, sameSite: "lax" as const, secure, path: "/" };

  if (json.access_token) jar.set("access_token", json.access_token, { ...base, maxAge: 60 * 60 }); // 1h
  if (json.id_token)     jar.set("id_token",     json.id_token,     { ...base, maxAge: 60 * 60 });
  if (json.refresh_token)jar.set("refresh_token",json.refresh_token,{ ...base, maxAge: 60 * 60 * 24 * 30 });

  // Clean up PKCE cookie
  jar.set("code_verifier", "", { ...base, maxAge: 0 });

  // Non-HTTP-only convenience flag if you want
  jar.set("logged_in", "1", { path: "/", sameSite: "lax", secure });

  // Go back to where we started
  return NextResponse.redirect(new URL(returnTo, url.origin), { status: 302 });
}