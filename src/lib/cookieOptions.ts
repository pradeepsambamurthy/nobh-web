// src/lib/cookieOptions.ts
export function cookieOptionsForEnv() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    secure: isProd,             // false in dev so cookies arrive over http://localhost
    sameSite: "lax" as const,   // good for top-level redirects
    path: "/",
    maxAge: 15 * 60,
  };
}