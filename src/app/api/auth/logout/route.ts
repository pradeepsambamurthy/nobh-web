import { NextResponse } from "next/server";

const DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const SIGNOUT_URI = process.env.NEXT_PUBLIC_SIGNOUT_URI!; // e.g. http://localhost:3001/

export async function GET() {
  const res = NextResponse.redirect(
    `${DOMAIN.replace(/\/$/,"")}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(SIGNOUT_URI)}`
  );
  ["access_token","id_token","refresh_token","logged_in"].forEach(n =>
    res.cookies.set(n, "", { path: "/", maxAge: 0 })
  );
  return res;
}