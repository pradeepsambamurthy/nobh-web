// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code  = url.searchParams.get("code") || "";
    const error = url.searchParams.get("error") || "";
    const error_description = url.searchParams.get("error_description") || "";
    const state = url.searchParams.get("state") || "/";

    if (error) {
      return NextResponse.json(
        { error: "auth_error", detail: decodeURIComponent(error_description) || error },
        { status: 400 }
      );
    }
    if (!code) {
      return NextResponse.json({ error: "missing_code" }, { status: 400 });
    }

    // PKCE verifier from the cookie set by /api/auth/start
    const cookieStore = await cookies();
    const code_verifier = cookieStore.get("pkce_v")?.value ?? "";

    const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
    const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI;

    if (!code_verifier || !COGNITO_DOMAIN || !CLIENT_ID || !REDIRECT_URI) {
      return NextResponse.json(
        {
          error: "missing_fields",
          have: {
            domain: !!COGNITO_DOMAIN,
            client_id: !!CLIENT_ID,
            redirect_uri: !!REDIRECT_URI,
            code_verifier: !!code_verifier,
          },
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "token_exchange_failed", status: tokenResp.status, details: json },
        { status: 400 }
      );
    }

    const { id_token, access_token, refresh_token, expires_in } = json ?? {};

    const res = NextResponse.redirect(decodeURIComponent(state || "/"), { status: 302 });

    // Set cookies (correct signature: name, value, options)
    const base = { httpOnly: true as const, sameSite: "lax" as const, secure: !!process.env.VERCEL, path: "/" };
    const max  = Math.max(60, Number(expires_in ?? 3600));

    if (id_token)     res.cookies.set("id_token", id_token,         { ...base, maxAge: max });
    if (access_token) res.cookies.set("access_token", access_token, { ...base, maxAge: max });
    if (refresh_token)res.cookies.set("refresh_token", refresh_token,{ ...base, maxAge: 60*60*24*7 });

    // Clear one-time PKCE verifier
    res.cookies.set("pkce_v", "", { ...base, maxAge: 0 });

    return res;
  } catch (e) {
    console.error("[auth/callback] unexpected", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}