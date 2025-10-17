// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const domain   = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "");
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
  const signout  = process.env.NEXT_PUBLIC_SIGNOUT_URI?.trim();

  const secure = process.env.NODE_ENV === "production";
  const base = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 0, // delete
  };

  const clearAll = (res: NextResponse) => {
    res.cookies.set("access_token", "", base);
    res.cookies.set("id_token", "", base);
    res.cookies.set("refresh_token", "", base);
    res.cookies.set("code_verifier", "", base);        // ✅ match the name you set on /auth/start
    if (secure) res.cookies.set("__Host-code_verifier", "", base);
    res.cookies.set("logged_in", "", { ...base, httpOnly: false });
  };

  // If env missing, just clear local cookies and go home
  if (!domain || !clientId || !signout) {
    const fallback = NextResponse.redirect("/", { status: 302, headers: { "Cache-Control": "no-store" } });
    clearAll(fallback);
    return fallback;
  }

  const url = new URL(`${domain}/logout`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("logout_uri", signout); // must be in Cognito's Allowed sign-out URLs

  const res = NextResponse.redirect(url.toString(), { status: 302, headers: { "Cache-Control": "no-store" } });
  clearAll(res);
  return res;
}