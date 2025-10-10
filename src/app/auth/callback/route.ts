// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDecode(v: string) {
  try { return decodeURIComponent(v); } catch { return v; }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code  = url.searchParams.get("code") || "";
    const error = url.searchParams.get("error") || "";
    const errDesc = url.searchParams.get("error_description") || "";
    const state = url.searchParams.get("state") || "/";

    if (error) {
      return new NextResponse(`Sign-in failed: ${safeDecode(errDesc) || error}`, { status: 400 });
    }
    if (!code) {
      return new NextResponse("Missing authorization code.", { status: 400 });
    }

    // Read one-time PKCE verifier set by /api/auth/start (or /auth/start)
    const cookieStore = await cookies();
    const code_verifier = cookieStore.get("pkce_v")?.value ?? "";

    // Server-side config
    const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
    const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const REDIRECT_URI   = process.env.NEXT_PUBLIC_REDIRECT_URI;

    if (!COGNITO_DOMAIN || !CLIENT_ID || !REDIRECT_URI || !code_verifier) {
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
        { status: 400 },
      );
    }

    // Exchange code for tokens
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

    const json = await tokenResp.json().catch(() => ({} as any));

    if (!tokenResp.ok) {
      console.error("[auth/callback] token exchange failed", tokenResp.status, json);
      return NextResponse.json(
        { error: "token_exchange_failed", status: tokenResp.status, details: json },
        { status: tokenResp.status },
      );
    }

    const { id_token, access_token, refresh_token, expires_in } = json as {
      id_token?: string;
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    const nextUrl = state ? safeDecode(state) : "/";

    const res = NextResponse.redirect(nextUrl, { status: 302 });

    // Cookie helpers (object overload avoids TS overload issues)
    const baseCookie = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: !!process.env.VERCEL,
      path: "/",
    };
    const max = Math.max(60, Number(expires_in ?? 3600));

    if (typeof id_token === "string" && id_token) {
      res.cookies.set({ name: "id_token", value: id_token, ...baseCookie, maxAge: max });
    }
    if (typeof access_token === "string" && access_token) {
      res.cookies.set({ name: "access_token", value: access_token, ...baseCookie, maxAge: max });
    }
    if (typeof refresh_token === "string" && refresh_token) {
      res.cookies.set({ name: "refresh_token", value: refresh_token, ...baseCookie, maxAge: 60 * 60 * 24 * 7 });
    }

    // Clear one-time PKCE verifier
    res.cookies.set({ name: "pkce_v", value: "", ...baseCookie, maxAge: 0 });

    return res;
  } catch (e) {
    console.error("[auth/callback] unexpected", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}