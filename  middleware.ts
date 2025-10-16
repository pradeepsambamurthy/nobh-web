import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

// Paths that should skip auth (static, auth, api, etc.)
const SKIP = [
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/mockServiceWorker\.js$/,
  /^\/auth(\/|$)/,        // /auth/* (e.g., /auth/callback)
  /^\/api\/auth(\/|$)/,   // /api/auth/*
  /^\/api\/health$/,      // optional health probe
  /^\/api\/.*$/,          // all API routes (leave server routes to enforce)
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // allow public paths
  if (pathname === "/") return NextResponse.next();
  if (SKIP.some(rx => rx.test(pathname))) return NextResponse.next();

  // consider logged-in if either token cookie exists
  const loggedIn = Boolean(
    req.cookies.get("access_token")?.value || req.cookies.get("id_token")?.value
  );

  if (!loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    const wanted = pathname + (search || "");
    if (isSafeInternalPath(wanted)) url.searchParams.set("return_to", wanted);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run on everything except assets and already-exempted routes above.
export const config = {
  matcher: ["/((?!_next|favicon.ico|api/.*|auth/.*|mockServiceWorker.js).*)"],
};