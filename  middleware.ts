// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Allow auth + static + dev MSW file
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/mockServiceWorker.js" // <-- MSW in dev
  ) {
    return NextResponse.next();
  }

  const loggedIn = req.cookies.get("logged_in")?.value === "true";
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

// Exclude API + static from auth checks
export const config = {
  matcher: ["/((?!_next|favicon.ico|auth/.*|api/.*|mockServiceWorker.js).*)"],
};