// middleware.ts
import { NextResponse, NextRequest } from "next/server";

function isSafeInternalPath(p?: string | null) {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only protect the sections you care about
  const protectedPaths = [
    /^\/residents(?:$|\/)/,
    /^\/visitors(?:$|\/)/,
    /^\/logs(?:$|\/)/,
    /^\/announcements(?:$|\/)/,
  ];

  if (!protectedPaths.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  const hasAuth =
    !!req.cookies.get("access_token")?.value ||
    !!req.cookies.get("id_token")?.value;

  if (!hasAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/start";
    const wanted = `${pathname}${search || ""}`;
    if (isSafeInternalPath(wanted)) {
      url.searchParams.set("state", wanted);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Minimal matcher: run middleware for everything under those sections,
// let all other pages and /api bypass quickly.
export const config = {
  matcher: [
    "/residents/:path*",
    "/visitors/:path*",
    "/logs/:path*",
    "/announcements/:path*",
    /^\/messages(?:$|\/)/,
  ],
};