import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code, code_verifier, redirect_uri, cognito_domain, client_id } = await req.json();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier,
    client_id,
    redirect_uri,
  });

  const resp = await fetch(`${cognito_domain.replace(/\/$/,"")}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await resp.text();
  if (!resp.ok) {
    return NextResponse.json({ error: "token_exchange_failed", details: text }, { status: 400 });
  }

  const tokens = JSON.parse(text) as {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };

  const res = NextResponse.json({ ok: true });

  // Secure-ish defaults; “secure” only on HTTPS (prod).
  const baseCookie = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tokens.expires_in,
  };

  res.cookies.set("access_token", tokens.access_token, baseCookie);
  res.cookies.set("id_token", tokens.id_token, baseCookie);
  // lightweight flag for middleware checks
  res.cookies.set("logged_in", "true", { ...baseCookie, httpOnly: false });

  return res;
}