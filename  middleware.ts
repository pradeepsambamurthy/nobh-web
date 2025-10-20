// middleware.ts
import { NextResponse, NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Protect these sections
  const protectedPaths = [
    /^\/residents(?:$|\/)/,
    /^\/visitors(?:$|\/)/,
    /^\/logs(?:$|\/)/,
    /^\/announcements(?:$|\/)/,
  ];

  const isProtected = protectedPaths.some((re) => re.test(pathname));
  if (!isProtected) return NextResponse.next();

  const hasAuth =
    !!req.cookies.get("access_token")?.value ||
    !!req.cookies.get("id_token")?.value;

  if (!hasAuth) {
    // Start PKCE — send the *state* param so we come back to this page
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/start";

    const wanted = `${pathname}${search || ""}`;
    if (isSafeInternalPath(wanted)) {
      url.searchParams.set("state", wanted); // 👈 standardize on `state`
    }

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Only run on app routes; skip assets & API/auth endpoints
export const config = {
  matcher: [
   
    "/((?!_next/|favicon.ico|api/(auth|health|v1|me).*|auth/.*|mockServiceWorker.js).*)",
  ],
};