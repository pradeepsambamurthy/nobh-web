// src/app/api/v1/route.ts
import { NextResponse } from "next/server";

// simple health check for Vercel
export const runtime = "edge";

export async function GET() {
  return NextResponse.json({ ok: true });
}