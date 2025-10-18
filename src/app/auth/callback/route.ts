import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(res: any, status = 400) {
  return NextResponse.json(res, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  try {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI?.trim();
    if (!domain || !clientId || !redirectUri) {
      return jsonError({ error: "missing_env", domain, clientId, redirectUri }, 500);
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state") || "/";
    if (!code) return jsonError({ error: "missing_code" }, 400);

    // ✅ Read cookie directly from request
    const codeVerifier =
      req.cookies.get("__Host-code_verifier")?.value ??
      req.cookies.get("code_verifier")?.value ??
      "";

    if (!codeVerifier) {
      return jsonError({ error: "missing_code_verifier", note: "no PKCE verifier cookie" }, 400);
    }

    // Exchange authorization code for tokens
    const tokenUrl = `${domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    });

    const tokRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const raw = await tokRes.text();
    let details: any = {};
    try {
      details = JSON.parse(raw);
    } catch {
      details = { raw };
    }

    if (!tokRes.ok) {
      console.error("[callback] token exchange failed:", tokRes.status, raw);
      return jsonError(
        {
          error: "token_exchange_failed",
          status: tokRes.status,
          reason: details,
          have: {
            domain,
            client_id_prefix: clientId.slice(0, 4),
            redirect_uri: redirectUri,
            code_len: code.length,
            code_verifier_len: codeVerifier.length,
          },
        },
        401
      );
    }

    const { access_token, id_token, refresh_token, expires_in = 3600 } = details;
    const dest = new URL(state, req.nextUrl.origin);

    const res = NextResponse.redirect(dest, { status: 302 });
    res.headers.set("Cache-Control", "no-store");

    const base = { httpOnly: true as const, sameSite: "lax" as const, secure: true, path: "/" };
    res.cookies.set("access_token", access_token, { ...base, maxAge: expires_in });
    res.cookies.set("id_token", id_token, { ...base, maxAge: expires_in });
    if (refresh_token) {
      res.cookies.set("refresh_token", refresh_token, { ...base, maxAge: 30 * 24 * 3600 });
    }

    // Clear verifier cookies
    res.cookies.set("__Host-code_verifier", "", { ...base, maxAge: 0 });
    res.cookies.set("code_verifier", "", { ...base, maxAge: 0 });

    res.cookies.set("logged_in", "1", {
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: false,
      maxAge: 7 * 24 * 3600,
    });

    console.log("[callback] success redirect →", dest.toString());
    return res;
  } catch (err: any) {
    console.error("[callback] EXCEPTION:", err);
    return jsonError({ error: "exception", message: err?.message ?? String(err) }, 500);
  }
}