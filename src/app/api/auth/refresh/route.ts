import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const domain   = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
  if (!domain || !clientId) {
    return NextResponse.json({ ok:false, error:"missing_env" }, { status: 500 });
  }

  const jar = await cookies();
  const refresh = jar.get("refresh_token")?.value;
  if (!refresh) {
    return NextResponse.json({ ok:false, error:"no_refresh_token" }, { status: 401 });
  }

  const tokenUrl = `${domain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refresh,
  });

  const r = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return NextResponse.json({ ok:false, error:"refresh_failed", details: data }, { status: 401 });
  }

  const { access_token, id_token, expires_in = 3600 } = data as {
    access_token: string; id_token?: string; expires_in?: number;
  };

  const secure = process.env.NODE_ENV === "production";
  const base = { httpOnly: true as const, sameSite: "lax" as const, secure, path:"/" };

  if (access_token) jar.set("access_token", access_token, { ...base, maxAge: expires_in });
  if (id_token)     jar.set("id_token",     id_token,     { ...base, maxAge: expires_in });

  return NextResponse.json({ ok: true });
}