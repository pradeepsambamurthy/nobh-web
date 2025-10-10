import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

    const { code, redirect_uri, cognito_domain, client_id } = payload;
    const code_verifier = cookies().get("pkce_v")?.value ?? null;

    if (!code || !redirect_uri || !cognito_domain || !client_id || !code_verifier) {
      return NextResponse.json({
        error: "missing_fields",
        have: {
          code: !!code,
          redirect_uri: !!redirect_uri,
          cognito_domain: !!cognito_domain,
          client_id: !!client_id,
          code_verifier: !!code_verifier,
        },
      }, { status: 400 });
    }

    const tokenUrl = `${cognito_domain.replace(/\/$/, "")}/oauth2/token`;
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
      cache: "no-store",
    });

    const json = await tokenResp.json().catch(() => null);

    if (!tokenResp.ok) {
      return NextResponse.json(
        { error: "token_exchange_failed", status: tokenResp.status, details: json },
        { status: tokenResp.status }
      );
    }

    const { id_token, access_token, refresh_token, expires_in } = json ?? {};
    const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

    const secure = !!process.env.VERCEL;
    const base = { httpOnly: true as const, sameSite: "lax" as const, secure, path: "/" };
    const max = Math.max(60, Number(expires_in ?? 3600));

    if (id_token) res.cookies.set("id_token", id_token, { ...base, maxAge: max });
    if (access_token) res.cookies.set("access_token", access_token, { ...base, maxAge: max });
    if (refresh_token)
      res.cookies.set("refresh_token", refresh_token, { ...base, maxAge: 60 * 60 * 24 * 7 });

    // Clear PKCE verifier
    res.cookies.set("pkce_v", "", { ...base, maxAge: 0 });

    return res;
  } catch (e) {
    console.error("[api/auth/callback] unexpected", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}