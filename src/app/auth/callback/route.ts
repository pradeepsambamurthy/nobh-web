// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CognitoTokenResponse {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  [k: string]: unknown;
}

function decodeURIComponentSafe(v: string) {
  try { return decodeURIComponent(v); } catch { return v; }
}
function errMessage(e: unknown) { return e instanceof Error ? e.message : String(e); }

export async function GET(req: NextRequest) {
  try {
    const url    = new URL(req.url);
    const code   = url.searchParams.get("code") ?? "";
    const error  = url.searchParams.get("error") ?? "";
    const errDes = url.searchParams.get("error_description") ?? "";

    if (error) {
      return NextResponse.json(
        { error: "auth_error", detail: decodeURIComponentSafe(errDes) || error },
        { status: 400 }
      );
    }
    if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

    const store = await cookies();
    const code_verifier =
      store.get("__Host-pkce_v")?.value ??
      store.get("pkce_v")?.value ??
      "";

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

    // Exchange
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
      return NextResponse.json(
        { error: "token_exchange_failed", status: tokenResp.status, details: json },
        { status: tokenResp.status }
      );
    }

    const { id_token, access_token, refresh_token, expires_in } = json;

    // Safe state handling & absolute redirect URL
    const rawState = url.searchParams.get("state") || "/";
    const decoded = decodeURIComponentSafe(rawState); // ✅ const (no prefer-const error)
    const nextPath = decoded.startsWith("/") ? decoded : "/";
    const dest = new URL(nextPath, url.origin);

    const res = NextResponse.redirect(dest, { status: 302 });

    const base = {
      httpOnly: true as const,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    const max = Math.max(60, Number(expires_in ?? 3600));

    if (id_token)      res.cookies.set("id_token", id_token,           { ...base, maxAge: max });
    if (access_token)  res.cookies.set("access_token", access_token,   { ...base, maxAge: max });
    if (refresh_token) res.cookies.set("refresh_token", refresh_token, { ...base, maxAge: 7 * 24 * 60 * 60 });

    // Clear one-time PKCE cookies
    res.cookies.set("pkce_v", "", { ...base, maxAge: 0 });
    if (base.secure) res.cookies.set("__Host-pkce_v", "", { ...base, maxAge: 0 });

    // Optional helper flag for UI
    res.cookies.set("logged_in", "true", {
      httpOnly: false, secure: base.secure, sameSite: "lax", path: "/", maxAge: max
    });

    return res;
  } catch (e: unknown) {
    console.error("[auth/callback] unexpected", e);
    return NextResponse.json({ error: "unexpected", message: errMessage(e) }, { status: 500 });
  }
}