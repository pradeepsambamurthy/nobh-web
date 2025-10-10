import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// read a single cookie from the raw request headers
function readCookieFromHeader(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") ?? "";
  const hit = raw.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="));
  if (!hit) return null;
  const v = hit.slice(name.length + 1);
  try { return decodeURIComponent(v); } catch { return v; }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

    const { code, redirect_uri, cognito_domain, client_id } = payload;

    // PKCE verifier set by /api/auth/start
    const code_verifier = readCookieFromHeader(req, "pkce_v");

    if (!code || !redirect_uri || !cognito_domain || !client_id || !code_verifier) {
      return NextResponse.json({
        error: "missing_fields",
        have: {
          code: !!code, redirect_uri: !!redirect_uri,
          cognito_domain: !!cognito_domain, client_id: !!client_id,
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
        { status: 500 }
      );
    }

    const { id_token, access_token, refresh_token, expires_in } = json ?? {};
    const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

    const secure = !!process.env.VERCEL;
    const base = { httpOnly: true as const, sameSite: "lax" as const, secure, path: "/" };
    const max = Math.max(60, Number(expires_in ?? 3600));

    if (id_token)      res.cookies.set("id_token", id_token,           { ...base, maxAge: max });
    if (access_token)  res.cookies.set("access_token", access_token,   { ...base, maxAge: max });
    if (refresh_token) res.cookies.set("refresh_token", refresh_token, { ...base, maxAge: 60 * 60 * 24 * 7 });

    // clear one-time PKCE verifier
    res.cookies.set("pkce_v", "", { ...base, maxAge: 0 });

    return res;
  } catch (e) {
    console.error("[api/auth/callback] unexpected", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}