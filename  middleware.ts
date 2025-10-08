// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow auth routes and static
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const loggedIn = req.cookies.get("logged_in")?.value === "true";
  if (!loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    // remember where they were going
    url.searchParams.set("return_to", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Still exclude API/static via matcher (see note #2)
export const config = {
  matcher: ["/((?!_next|favicon.ico|auth/.*|api/.*).*)"],
};