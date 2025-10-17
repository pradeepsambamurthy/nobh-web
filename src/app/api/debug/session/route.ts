import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function b64urlToJson<T = unknown>(seg?: string | null): T | null {
  if (!seg) return null;
  try {
    let b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
    if (b64.length % 4) b64 += "=".repeat(4 - (b64.length % 4));
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export async function GET() {
  const store = await cookies();
  const idToken     = store.get("id_token")?.value ?? "";
  const accessToken = store.get("access_token")?.value ?? "";
  const refresh     = store.get("refresh_token")?.value ?? "";

  const has = {
    id_token: !!idToken,
    access_token: !!accessToken,
    refresh_token: !!refresh,
  };

  // Not logged in
  if (!has.id_token) {
    return new NextResponse(
      JSON.stringify({ loggedIn: false, cookies: has, note: "No id_token cookie present" }),
      { status: 401, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }

  // Decode without verify (handy when JWKS/envs are missing)
  const [, payloadSeg] = idToken.split(".");
  const decoded = b64urlToJson<JWTPayload>(payloadSeg);

  // Prefer server-only env names; fall back to NEXT_PUBLIC_* if you haven’t created server-only ones yet.
  const REGION       = process.env.COGNITO_REGION       ?? process.env.NEXT_PUBLIC_COGNITO_REGION;
  const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const CLIENT_ID    = process.env.COGNITO_CLIENT_ID    ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  let verified: boolean | null = null;
  let verifyError: string | null = null;
  let verifiedPayload: JWTPayload | undefined;

  if (REGION && USER_POOL_ID && CLIENT_ID) {
    try {
      const issuer = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
      const JWKS = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer,
        audience: CLIENT_ID, // ID tokens use App Client ID as audience
      });
      verified = true;
      verifiedPayload = payload;
    } catch (err: any) {
      verified = false;
      verifyError = err?.message ?? String(err);
    }
  }

  // In production, don’t echo the entire claims object unless you really want to.
  const exposeClaims = process.env.NODE_ENV !== "production";

  const body = {
    loggedIn: true,
    cookies: has,
    verified,        // true/false/null
    verifyError,     // null if success or not attempted
    claims: exposeClaims ? (verifiedPayload ?? decoded ?? {}) : undefined,
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}