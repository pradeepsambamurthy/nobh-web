// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const SIGNOUT_URI = process.env.NEXT_PUBLIC_SIGNOUT_URI; // e.g. https://nobh-web.vercel.app/

  if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID || !SIGNOUT_URI) {
    return NextResponse.json(
      {
        error: "env_missing",
        have: {
          COGNITO_DOMAIN: !!COGNITO_DOMAIN,
          COGNITO_CLIENT_ID: !!COGNITO_CLIENT_ID,
          SIGNOUT_URI: !!SIGNOUT_URI,
        },
      },
      { status: 500 }
    );
  }

  // Cognito hosted UI logout
  const url = new URL(`${COGNITO_DOMAIN}/logout`);
  url.searchParams.set("client_id", COGNITO_CLIENT_ID);
  url.searchParams.set("logout_uri", SIGNOUT_URI);

  const res = NextResponse.redirect(url.toString(), { status: 302 });

  // Clear all our cookies
  const base = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: !!process.env.VERCEL,
    path: "/",
    maxAge: 0,
  };

  res.cookies.set("access_token", "", base);
  res.cookies.set("id_token", "", base);
  res.cookies.set("refresh_token", "", base);
  res.cookies.set("pkce_v", "", base);
  // If you set a non-httpOnly "logged_in" flag anywhere, clear that too:
  res.cookies.set("logged_in", "", { ...base, httpOnly: false });

  return res;
}