import { NextRequest, NextResponse } from "next/server";
import { COGNITO_DOMAIN, COGNITO_CLIENT_ID, SIGNOUT_URI } from "@/lib/auth/config";

export async function GET(_req: NextRequest) {
  const res = NextResponse.redirect(
    `${COGNITO_DOMAIN}/logout?client_id=${encodeURIComponent(COGNITO_CLIENT_ID)}&logout_uri=${encodeURIComponent(SIGNOUT_URI)}`
  );

  // clear our cookies
  const opts = { path: "/", maxAge: 0 };
  res.cookies.set("access_token", "", opts);
  res.cookies.set("id_token", "", opts);
  res.cookies.set("logged_in", "", opts);

  return res;
}