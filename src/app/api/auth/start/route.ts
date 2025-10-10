// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Always allow the auth handshake, static files, and service worker
  if (
    pathname.startsWith("/auth") ||          // /auth/callback
    pathname.startsWith("/api/auth") ||      // /api/auth/start, /api/auth/callback, /api/auth/logout
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/mockServiceWorker.js"
  ) {
    return NextResponse.next();
  }

  // 2) Always allow the public home page so users can see the Login button
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 3) Consider user logged in if we have tokens set by the callback route
  const hasId   = !!req.cookies.get("id_token")?.value;
  const hasAccess = !!req.cookies.get("access_token")?.value;
  const loggedIn = hasId || hasAccess; // no need for a separate "logged_in" cookie

  if (!loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/";

    const wanted = pathname + (req.nextUrl.search || "");
    if (isSafeInternalPath(wanted)) {
      url.searchParams.set("return_to", wanted);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Exclude API + static + auth from auth checks
export const config = {
  matcher: ["/((?!_next|favicon.ico|auth/.*|api/auth/.*|mockServiceWorker.js).*)"],
};