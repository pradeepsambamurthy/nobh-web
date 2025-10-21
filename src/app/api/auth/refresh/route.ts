import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // ⬇️ NOTE: await cookies() here
    const jar = await cookies();
    const refreshToken = jar.get("refresh_token")?.value;

    const domain   = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim();
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();

    if (!domain || !clientId || !refreshToken) {
      return NextResponse.json(
        { refreshed: false, reason: "missing_env_or_token" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const tokenUrl = `${domain.replace(/\/$/, "")}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: refreshToken,
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { refreshed: false, status: res.status },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const tokens: any = await res.json();

    const r = NextResponse.json(
      { refreshed: true },
      { headers: { "Cache-Control": "no-store" } }
    );

    // Update cookies if present
    const base = { path: "/", httpOnly: true as const, sameSite: "lax" as const, secure: true as const };

    if (tokens.id_token)     r.cookies.set("id_token",     tokens.id_token,     base);
    if (tokens.access_token) r.cookies.set("access_token", tokens.access_token, base);
    if (tokens.refresh_token) {
      r.cookies.set("refresh_token", tokens.refresh_token, { ...base, maxAge: 30 * 24 * 3600 }); // 30d
    }

    return r;
  } catch (err) {
    console.error("[auth/refresh]", err);
    return NextResponse.json(
      { refreshed: false, error: String(err) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}