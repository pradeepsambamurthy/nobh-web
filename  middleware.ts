// middleware.ts (nobh-web)
import { NextResponse, NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Any sections that require login:
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
    // Kick off PKCE flow. /api/auth/start expects ?return_to=...
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/start";

    const wanted = `${pathname}${search || ""}`;
    if (isSafeInternalPath(wanted)) {
      url.searchParams.set("return_to", wanted); 
    }

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run on app routes only; skip assets & auth/api endpoints
export const config = {
  matcher: [
    // exclude Next assets
    "/((?!_next/|favicon.ico"
      // exclude auth endpoints
      + "|api/auth/.*"
      // exclude your API routes
      + "|api/health"
      + "|api/v1/.*"
      + "|api/me"            // ✅ exclude /api/me so it isn't intercepted
      // optional: exclude callback pages if you have /auth/...
      + "|auth/.*"
      + "|mockServiceWorker.js).*)",
  ],
};