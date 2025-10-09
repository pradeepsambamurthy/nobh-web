import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code, code_verifier, redirect_uri, cognito_domain, client_id } = await req.json();

    if (!code || !code_verifier || !redirect_uri || !cognito_domain || !client_id) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const tokenUrl = `${cognito_domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id,
      code,
      code_verifier,
      redirect_uri,
    });

    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const json = await tokenResp.json();
    if (!tokenResp.ok) {
      return NextResponse.json({ error: "token_exchange_failed", details: json }, { status: 500 });
    }

    const { id_token, access_token, refresh_token, expires_in } = json;

    const res = NextResponse.json({ ok: true });

    const secure = process.env.VERCEL === "1"; // on Vercel use Secure cookies
    const cookieOpts = {
      httpOnly: true as const,
      sameSite: "lax" as const,
      secure,
      path: "/",
      maxAge: Math.max(60, Number(expires_in ?? 3600)),
    };

    if (id_token)     res.cookies.set("id_token", id_token, cookieOpts);
    if (access_token) res.cookies.set("access_token", access_token, cookieOpts);
    if (refresh_token)res.cookies.set("refresh_token", refresh_token, { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });

    return res;
  } catch (e) {
    console.error("[api/auth/callback] error", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}