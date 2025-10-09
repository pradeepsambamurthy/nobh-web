// src/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // enables Buffer in Vercel

function decodeJwt<T extends Record<string, unknown>>(jwt: string): T | null {
  try {
    const b64 = jwt.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf-8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = req.cookies.get("id_token")?.value;
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const claims = decodeJwt<{
    email?: string;
    name?: string;
    sub?: string;
    "cognito:groups"?: string[];
  }>(id);

  return NextResponse.json({
    email: claims?.email ?? null,
    name: claims?.name ?? null,
    sub: claims?.sub ?? null,
    groups: claims?.["cognito:groups"] ?? [],
  });
}