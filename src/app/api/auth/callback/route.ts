import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function j(res: any, status = 400) {
  return NextResponse.json(res, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  try {
    const domain     = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
    const clientId   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
    const redirectUri= process.env.NEXT_PUBLIC_REDIRECT_URI?.trim();

    if (!domain || !clientId || !redirectUri) {
      return j({ error: "missing_env", have: { domain: !!domain, clientId: !!clientId, redirectUri: !!redirectUri } }, 500);
    }

    const code  = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state") || "/";
    if (!code) return j({ error: "missing_code" }, 400);

    // Read either cookie name (prod vs local dev)
    const codeVerifier =
      req.cookies.get("__Host-code_verifier")?.value ??
      req.cookies.get("code_verifier")?.value ??
      "";

    if (!codeVerifier) {
      return j({ error: "missing_code_verifier", note: "PKCE verifier cookie not present" }, 400);
    }

    // Build token request
    const tokenUrl = `${domain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    });

    // ✅ THIS is the debug print you asked for
    console.log("[callback] token request", {
      tokenUrl,
      body: Object.fromEntries(body),
      usingClientSecret: !!process.env.COGNITO_CLIENT_SECRET,
    });

    // If the Cognito App Client has a secret, send HTTP Basic auth
    const authHeader = process.env.COGNITO_CLIENT_SECRET
      ? "Basic " + Buffer.from(`${clientId}:${process.env.COGNITO_CLIENT_SECRET}`).toString("base64")
      : undefined;

    const tokRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body,
      cache: "no-store",
    });

    const tokText = await tokRes.text();
    let details: any;
    try { details = JSON.parse(tokText); } catch { details = { raw: tokText }; }

    if (!tokRes.ok) {
      console.error("[callback] token exchange failed:", tokRes.status, tokText);
      return j(
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

    // Absolute redirect destination (avoid relative crash)
    const dest = new URL(state, req.nextUrl.origin);
    const res  = NextResponse.redirect(dest, { status: 302 });
    res.headers.set("Cache-Control", "no-store");

    const base = { httpOnly: true as const, sameSite: "lax" as const, secure: true, path: "/" };
    res.cookies.set("access_token", access_token, { ...base, maxAge: expires_in });
    res.cookies.set("id_token",      id_token,      { ...base, maxAge: expires_in });
    if (refresh_token) {
      res.cookies.set("refresh_token", refresh_token, { ...base, maxAge: 30 * 24 * 3600 });
    }

    // Clear verifier cookie(s)
    res.cookies.set("__Host-code_verifier", "", { ...base, maxAge: 0 });
    res.cookies.set("code_verifier",        "", { ...base, maxAge: 0 });

    // Optional UI helper
    res.cookies.set("logged_in", "1", { path: "/", sameSite: "lax", secure: true, httpOnly: false, maxAge: 7 * 24 * 3600 });

    console.log("[callback] token exchange success →", dest.toString());
    return res;
  } catch (err: any) {
    console.error("[callback] exception:", err);
    return j({ error: "exception", message: err?.message ?? String(err) }, 500);
  }
}