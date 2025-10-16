// app/api/debug/cookies/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const all = (await cookies()).getAll().map(c => ({
    name: c.name,
    // don’t dump secrets in full:
    value: (c.value ?? "").slice(0, 12) + (c.value?.length ? "…" : ""),
  }));
  return NextResponse.json({ cookies: all }, { status: 200 });
}