// middleware.ts (nobh-web)
import { NextResponse, NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect app pages (adjust list as you add sections)
  const protectedPaths = [/^\/residents($|\/)/, /^\/visitors($|\/)/, /^\/announcements($|\/)/];
  const isProtected = protectedPaths.some((re) => re.test(pathname));
  if (!isProtected) return NextResponse.next();

  const hasAuth =
    !!req.cookies.get("access_token")?.value ||
    !!req.cookies.get("id_token")?.value;

  if (!hasAuth) {
    // Kick off PKCE flow (GET handler in /api/auth/start sets code_verifier & redirects to Cognito)
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/start";

    const wanted = `${pathname}${req.nextUrl.search || ""}`;
    if (isSafeInternalPath(wanted)) url.searchParams.set("state", wanted);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run only on app routes; skip Next assets, API, auth endpoints, etc.
  matcher: ["/((?!_next|favicon.ico|api/auth/.*|api/health|api/v1/.*|auth/.*|mockServiceWorker.js).*)"],
};