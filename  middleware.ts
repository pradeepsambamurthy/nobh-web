// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Always allow preflight
  if (req.method === "OPTIONS") return NextResponse.next();

  // 2) Allow auth handshake + API + Next/static + common public files
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webmanifest")
  ) {
    return NextResponse.next();
  }

  // 3) Allow home (login link)
  if (pathname === "/") return NextResponse.next();

  // 4) Gate everything else on auth cookies
  const loggedIn =
    !!req.cookies.get("id_token")?.value ||
    !!req.cookies.get("access_token")?.value;

  if (!loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    const wanted = pathname + (req.nextUrl.search || "");
    if (isSafeInternalPath(wanted)) url.searchParams.set("return_to", wanted);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/.*|auth/.*|mockServiceWorker.js).*)"],
};