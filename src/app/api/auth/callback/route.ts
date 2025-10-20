import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function j(res: any, status = 400) {
  return NextResponse.json(res, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  try {
    const domain      = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
    const clientId    = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI?.trim();
    if (!domain || !clientId || !redirectUri) return j({ error: "missing_env" }, 500);

    const code  = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state") || "/";
    if (!code) return j({ error: "missing_code" }, 400);

    // Read both names to support prod + localhost
    const codeVerifier =
      req.cookies.get("__Host-code_verifier")?.value ??
      req.cookies.get("code_verifier")?.value ??
      "";

    if (!codeVerifier) return j({ error: "missing_code_verifier", note: "no PKCE verifier cookie" }, 400);

    // Exchange the code for tokens
    const tokenUrl = `${domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    });

    // Optional debug:
    // console.log("[callback] token request", { tokenUrl, body: Object.fromEntries(body) });

    const tokRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const text = await tokRes.text();
    let details: any; try { details = JSON.parse(text); } catch { details = { raw: text }; }

    if (!tokRes.ok) {
      return j({ error: "token_exchange_failed", status: tokRes.status, details }, 401);
    }

    const { access_token, id_token, refresh_token, expires_in = 3600 } = details;

    // Redirect destination must be absolute
    const dest = new URL(state, req.nextUrl.origin);
    const res = NextResponse.redirect(dest, { status: 302 });
    res.headers.set("Cache-Control", "no-store");

    // Auth cookies (HTTPS only in prod on Vercel)
    const base = { httpOnly: true as const, sameSite: "lax" as const, secure: true, path: "/" };
    res.cookies.set("access_token", access_token, { ...base, maxAge: expires_in });
    res.cookies.set("id_token", id_token, { ...base, maxAge: expires_in });
    if (refresh_token) res.cookies.set("refresh_token", refresh_token, { ...base, maxAge: 30 * 24 * 3600 });

    // Clear possible verifier cookies
    res.cookies.set("__Host-code_verifier", "", { ...base, maxAge: 0 });
    res.cookies.set("code_verifier", "", { ...base, maxAge: 0 });

    // UI helper (non-HttpOnly)
    res.cookies.set("logged_in", "1", { path: "/", sameSite: "lax", secure: true, httpOnly: false, maxAge: 7 * 24 * 3600 });

    return res;
  } catch (err: any) {
    return j({ error: "exception", message: err?.message ?? String(err) }, 500);
  }
}