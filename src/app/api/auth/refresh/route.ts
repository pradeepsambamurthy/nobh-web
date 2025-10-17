import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const store = await cookies();
  const refresh = store.get("refresh_token")?.value;

  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const client = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!refresh || !domain || !client) {
    return NextResponse.json(
      { error: "missing_fields", have: { refresh: !!refresh, domain: !!domain, client: !!client } },
      { status: 400 }
    );
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: client,
    refresh_token: refresh,
  });

  const resp = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return NextResponse.json({ error: "refresh_failed", details: json }, { status: 401 });
  }

  const base = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  const max = Math.max(60, Number(json.expires_in ?? 3600));
  const res = NextResponse.json({ ok: true });

  if (json.access_token) res.cookies.set("access_token", json.access_token, { ...base, maxAge: max });
  if (json.id_token)     res.cookies.set("id_token", json.id_token,       { ...base, maxAge: max });
  // refresh_token may be rotated; set if present
  if (json.refresh_token) res.cookies.set("refresh_token", json.refresh_token, { ...base, maxAge: 7 * 24 * 3600 });

  return res;
}