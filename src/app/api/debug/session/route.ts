import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Only import jose on the server runtime
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
  // cookies set by /auth/callback
  const store = await cookies();
  const idToken     = store.get("id_token")?.value ?? "";
  const accessToken = store.get("access_token")?.value ?? "";
  const refresh     = store.get("refresh_token")?.value ?? "";

  const has = {
    id_token: !!idToken,
    access_token: !!accessToken,
    refresh_token: !!refresh,
  };

  // If not logged in, return early
  if (!has.id_token) {
    return NextResponse.json(
      { loggedIn: false, cookies: has, note: "No id_token cookie present" },
      { status: 401 }
    );
  }

  // Decode the JWT payload without verification (useful even if env vars are missing)
  const [_, payloadSeg] = idToken.split(".");
  const decoded = b64urlToJson<JWTPayload>(payloadSeg);

  // Optional: verify the ID token via Cognito JWKS (requires these envs)
  const REGION       = process.env.NEXT_PUBLIC_COGNITO_REGION;
  const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const CLIENT_ID    = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  let verified: boolean | null = null;
  let verifyError: string | null = null;

  if (REGION && USER_POOL_ID && CLIENT_ID) {
    try {
      const issuer = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
      const JWKS = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
      const { payload, protectedHeader } = await jwtVerify(idToken, JWKS, {
        issuer,
        audience: CLIENT_ID, // ID tokens use the App Client ID as audience
      });
      verified = true;

      // if you also want to expose the verified payload/header:
      return NextResponse.json({
        loggedIn: true,
        cookies: has,
        verified,
        token_use: payload.token_use,
        claims: payload,
        header: protectedHeader,
      });
    } catch (err: any) {
      verified = false;
      verifyError = err?.message ?? String(err);
    }
  }

  // Fallback (no envs or verification failed) – still return decoded info
  return NextResponse.json({
    loggedIn: true,
    cookies: has,
    verified,              // true/false/null
    verifyError,           // null if success or verification not attempted
    claims: decoded ?? {}, // decoded (unverified) claims for quick inspection
  });
}