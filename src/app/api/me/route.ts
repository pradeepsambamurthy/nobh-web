// src/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // uses atob()

function b64urlDecode(input: string): string {
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  if (b64.length % 4) b64 += "=".repeat(4 - (b64.length % 4));
  return atob(b64);
}

type IdClaims = {
  email?: string;
  name?: string;
  sub?: string;
  "cognito:groups"?: string[];
};

function decodeJwt(jwt: string): IdClaims | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    return JSON.parse(b64urlDecode(payload)) as IdClaims;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const id = req.cookies.get("id_token")?.value;
  if (!id) {
    return new NextResponse(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  const claims = decodeJwt(id);
  return new NextResponse(
    JSON.stringify({
      authenticated: true,
      email: claims?.email ?? null,
      name: claims?.name ?? null,
      sub: claims?.sub ?? null,
      groups: claims?.["cognito:groups"] ?? [],
    }),
    { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}