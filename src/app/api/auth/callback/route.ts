export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code, code_verifier, redirect_uri, cognito_domain, client_id } = await req.json();

    if (!code || !code_verifier || !redirect_uri || !cognito_domain || !client_id) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const tokenUrl = `${cognito_domain.replace(/\/$/, "")}/oauth2/token`;
    const form = new URLSearchParams({
      grant_type: "authorization_code",
      client_id,
      code,
      code_verifier,
      redirect_uri,
    });

    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    const json = await tokenResp.json().catch(() => ({}));
    if (!tokenResp.ok) {
      console.error("[callback] token exchange failed", tokenResp.status, json);
      return NextResponse.json(
        { error: "token_exchange_failed", status: tokenResp.status, details: json },
        { status: 500 }
      );
    }

    const { id_token, access_token, refresh_token, expires_in } = json;
    const res = NextResponse.json({ ok: true });

    const baseCookie = {
      httpOnly: true as const,
      sameSite: "none" as const,
      secure: true,
      path: "/",
      maxAge: Math.max(60, Number(expires_in ?? 3600)),
    };

    if (id_token) res.cookies.set("id_token", id_token, baseCookie);
    if (access_token) res.cookies.set("access_token", access_token, baseCookie);
    if (refresh_token)
      res.cookies.set("refresh_token", refresh_token, { ...baseCookie, maxAge: 60 * 60 * 24 * 7 });

    res.headers.append(
      "Set-Cookie",
      "pkce_v=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None"
    );

    return res;
  } catch (e) {
    console.error("[api/auth/callback] error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}