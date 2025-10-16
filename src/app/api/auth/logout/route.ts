import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const domain   = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const signout  = process.env.NEXT_PUBLIC_SIGNOUT_URI;

  if (!domain || !clientId || !signout) {
    return NextResponse.json(
      { error: "env_missing", have: { domain: !!domain, clientId: !!clientId, signout: !!signout } },
      { status: 500 }
    );
  }

  const url = new URL(`${domain}/logout`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("logout_uri", signout);

  const res = NextResponse.redirect(url.toString(), { status: 302 });

  const base = { httpOnly: true as const, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 };
  res.cookies.set("access_token", "", base);
  res.cookies.set("id_token", "", base);
  res.cookies.set("refresh_token", "", base);
  res.cookies.set("pkce_v", "", base);
  res.cookies.set("logged_in", "", { ...base, httpOnly: false });

  return res;
}