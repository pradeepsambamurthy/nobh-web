import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
  const codeVerifier = (await cookies()).get("code_verifier")?.value;

  if (!code || !domain || !clientId || !redirectUri || !codeVerifier) {
    return NextResponse.json(
      { error: "missing_fields", have: { domain: !!domain, clientId: !!clientId, redirect_uri: !!redirectUri, code_verifier: !!codeVerifier } },
      { status: 400 }
    );
  }

  const tokenRes = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json({ error: "token_exchange_failed", details: tokens }, { status: 400 });
  }

  // store tokens in cookies
  const store = await cookies();
  store.set({ name: "id_token", value: tokens.id_token, httpOnly: true, secure: true, path: "/", sameSite: "lax" });
  store.set({ name: "access_token", value: tokens.access_token, httpOnly: true, secure: true, path: "/", sameSite: "lax" });

  // redirect to dashboard or /residents
  return NextResponse.redirect(new URL("/residents", req.url));
}