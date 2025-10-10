import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the auth handshake & static
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/mockServiceWorker.js"
  ) {
    return NextResponse.next();
  }

  // Allow home so users can click "Login"
  if (pathname === "/") return NextResponse.next();

  // Consider logged in if access or id token exists
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