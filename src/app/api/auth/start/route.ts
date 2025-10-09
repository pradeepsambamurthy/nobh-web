// src/app/api/auth/start/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

function base64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomVerifier(len = 64) {
  // RFC7636 allowed chars
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function POST() {
  const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const COGNITO_CLIENTID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI!;
  const OAUTH_SCOPES = "openid email profile";

  if (!COGNITO_DOMAIN || !COGNITO_CLIENTID || !REDIRECT_URI) {
    return NextResponse.json({ error: "Missing Cognito env" }, { status: 500 });
  }

  // 1) Make verifier & challenge on the server
  const verifier = randomVerifier(64);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = base64Url(Buffer.from(digest));

  // 2) Build the Cognito authorize URL
  const domain = COGNITO_DOMAIN.replace(/\/$/, "");
  const url = new URL(`${domain}/oauth2/authorize`);
  url.searchParams.set("client_id", COGNITO_CLIENTID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", OAUTH_SCOPES);
  url.searchParams.set("state", encodeURIComponent("/residents"));
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  // 3) 🔒 Send PKCE verifier back as a secure cookie (do NOT use cookies().set here)
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    [
      `pkce_v=${verifier}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=None",
      "Max-Age=300", // 5 minutes
    ].join("; ")
  );

  // 4) Redirect the browser to Cognito with the cookie set
  return NextResponse.redirect(url, { headers });
}