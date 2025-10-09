export const runtime = "nodejs";

import { NextResponse } from "next/server";

function base64Url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomVerifier(len = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function POST() {
  const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const COGNITO_CLIENTID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI!;
  const OAUTH_SCOPES = "openid email profile";

  if (!COGNITO_DOMAIN || !COGNITO_CLIENTID || !REDIRECT_URI) {
    return NextResponse.json({ error: "Missing Cognito env vars" }, { status: 500 });
  }

  const verifier = randomVerifier();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64Url(Buffer.from(digest));

  const url = new URL(`${COGNITO_DOMAIN.replace(/\/$/, "")}/oauth2/authorize`);
  url.searchParams.set("client_id", COGNITO_CLIENTID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", OAUTH_SCOPES);
  url.searchParams.set("state", encodeURIComponent("/residents"));
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    [
      `pkce_v=${verifier}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=None",
      "Max-Age=300",
    ].join("; ")
  );

  return NextResponse.redirect(url, { headers });
}