// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code, code_verifier, redirect_uri, cognito_domain, client_id } = await req.json();

  // normalize domain (avoid double slashes)
  const domain = String(cognito_domain).replace(/\/+$/, "");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier,
    client_id,
    redirect_uri,            // must EXACTLY match the app client's callback URL
  });

  const resp = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await resp.text();

  // TEMP: surface the exact Cognito error to the client while we debug
  if (!resp.ok) {
    console.error("Token exchange failed:", resp.status, text);
    return NextResponse.json(
      { error: "token_exchange_failed", status: resp.status, details: text },
      { status: 400 }
    );
  }

  const tokens = JSON.parse(text); // { access_token, id_token, refresh_token?, expires_in, token_type }

  const res = NextResponse.json({ ok: true });

  // httpOnly cookies (dev: no `secure`; prod: add `secure: true`, `sameSite: "lax"` or "strict")
  res.cookies.set("access_token", tokens.access_token, { httpOnly: true, path: "/", maxAge: tokens.expires_in });
  res.cookies.set("id_token", tokens.id_token, { httpOnly: true, path: "/", maxAge: tokens.expires_in });
  res.cookies.set("logged_in", "true", { path: "/", maxAge: tokens.expires_in });

  return res;
}