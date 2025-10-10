import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const code: string | undefined = payload.code;

    // Read config from SERVER env (do NOT trust client)
    const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
    const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI;

    const cookieStore = await cookies();
    const code_verifier = cookieStore.get("pkce_v")?.value ?? "";

    if (!code || !COGNITO_DOMAIN || !CLIENT_ID || !REDIRECT_URI || !code_verifier) {
      return NextResponse.json({
        error: "missing_fields",
        have: {
          code: !!code,
          cognito_domain: !!COGNITO_DOMAIN,
          client_id: !!CLIENT_ID,
          redirect_uri: !!REDIRECT_URI,
          code_verifier: !!code_verifier,
        },
      }, { status: 400 });
    }

    const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier,
      redirect_uri: REDIRECT_URI,
    });

    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const json = await tokenResp.json().catch(() => null);

    if (!tokenResp.ok) {
      console.error("[token] exchange failed", tokenResp.status, json);
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

    if (id_token)     res.cookies.set("id_token", id_token,         { ...base, maxAge: max });
    if (access_token) res.cookies.set("access_token", access_token, { ...base, maxAge: max });
    if (refresh_token)res.cookies.set("refresh_token", refresh_token,{ ...base, maxAge: 60*60*24*7 });

    // clear one-time PKCE verifier
    res.cookies.set("pkce_v", "", { ...base, maxAge: 0 });

    return res;
  } catch (e) {
    console.error("[api/auth/callback] unexpected", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}