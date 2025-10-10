// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDecode(v: string) { try { return decodeURIComponent(v); } catch { return v; } }

interface CognitoTokenResponse {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  [k: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code  = url.searchParams.get("code") || "";
    const error = url.searchParams.get("error") || "";
    const errDesc = url.searchParams.get("error_description") || "";
    const state = url.searchParams.get("state") || "/";

    if (error) {
      return NextResponse.json(
        { error: "auth_error", detail: safeDecode(errDesc) || error },
        { status: 400 }
      );
    }
    if (!code) {
      return NextResponse.json({ error: "missing_code" }, { status: 400 });
    }

    // Read PKCE verifier (prefer __Host- cookie, fall back to old name)
    const store = await cookies();
    const code_verifier =
      store.get("__Host-pkce_v")?.value ??
      store.get("pkce_v")?.value ??
      "";

    const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
    const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI;

    if (!code_verifier || !COGNITO_DOMAIN || !CLIENT_ID || !REDIRECT_URI) {
      console.log("[auth/callback] missing", {
        domain: !!COGNITO_DOMAIN,
        client_id: !!CLIENT_ID,
        redirect_uri: !!REDIRECT_URI,
        code_verifier: !!code_verifier,
      });
      return NextResponse.json(
        {
          error: "missing_fields",
          have: {
            code: true,
            client_id: !!CLIENT_ID,
            redirect_uri: !!REDIRECT_URI,
            domain: !!COGNITO_DOMAIN,
            code_verifier: !!code_verifier,
          },
        },
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens
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

    const json = (await tokenResp.json().catch(() => ({}))) as CognitoTokenResponse;

    if (!tokenResp.ok) {
      console.error("[auth/callback] token exchange failed", tokenResp.status, json);
      return NextResponse.json(
        { error: "token_exchange_failed", status: tokenResp.status, details: json },
        { status: tokenResp.status }
      );
    }

    const { id_token, access_token, refresh_token, expires_in } = json;
    const nextUrl = state ? safeDecode(state) : "/";

    const res = NextResponse.redirect(nextUrl, { status: 302 });

    // HttpOnly auth cookies for app use; Lax works for normal navigations
    const base = { httpOnly: true as const, sameSite: "lax" as const, secure: true, path: "/" };
    const max  = Math.max(60, Number(expires_in ?? 3600));

    if (id_token)     res.cookies.set("id_token", id_token,         { ...base, maxAge: max });
    if (access_token) res.cookies.set("access_token", access_token, { ...base, maxAge: max });
    if (refresh_token)res.cookies.set("refresh_token", refresh_token,{ ...base, maxAge: 7 * 24 * 60 * 60 });

    // Clear the PKCE cookies after success (support both names)
    res.cookies.set("__Host-pkce_v", "", { ...base, maxAge: 0 });
    res.cookies.set("pkce_v", "",        { ...base, maxAge: 0 });

    // Optional convenience flag for UI/middleware (non-HttpOnly)
    // res.cookies.set("logged_in", "true", { ...base, httpOnly: false, maxAge: max });

    return res;
  } catch (e) {
    console.error("[auth/callback] unexpected", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}