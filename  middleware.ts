import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Allow the landing page without auth
  if (pathname === "/") return NextResponse.next();

  const loggedIn =
    !!req.cookies.get("access_token")?.value ||
    !!req.cookies.get("id_token")?.value;

  if (!loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    const wanted = `${pathname}${req.nextUrl.search || ""}`;
    if (isSafeInternalPath(wanted)) url.searchParams.set("return_to", wanted);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Don't run on assets, API, or auth
  matcher: ["/((?!_next|favicon.ico|api/.*|auth/.*|mockServiceWorker.js).*)"],
};