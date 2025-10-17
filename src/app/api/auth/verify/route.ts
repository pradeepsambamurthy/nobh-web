// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGION = process.env.NEXT_PUBLIC_COGNITO_REGION!;
const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const JWKS = createRemoteJWKSet(
  new URL(`https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`)
);

export async function GET() {
  const id = (await cookies()).get("id_token")?.value;
  if (!id) return NextResponse.json({ authenticated:false }, { status: 200 });

  try {
    const { payload } = await jwtVerify(id, JWKS, {
      issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
      audience: CLIENT_ID,
    });
    return NextResponse.json({ authenticated:true, email: payload.email ?? null });
  } catch {
    return NextResponse.json({ authenticated:false }, { status: 200 });
  }
}