import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __ANNOUNCEMENTS__?: any[] };
if (!g.__ANNOUNCEMENTS__) {
  g.__ANNOUNCEMENTS__ = [
    {
      id: "a1",
      title: "Fire Drill Scheduled",
      body: "Please vacate your flats at 10 AM this Saturday for a mock fire drill.",
      createdAt: new Date().toISOString(),
      pinned: true,
    },
    {
      id: "a2",
      title: "Water Tank Cleaning",
      body: "Water supply will be off from 2 PM to 5 PM tomorrow.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}
const ANNOUNCEMENTS = g.__ANNOUNCEMENTS__!;

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get("id_token")?.value;
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    return NextResponse.json({ data: ANNOUNCEMENTS });
  } catch (e: any) {
    console.error("[GET /api/v1/announcements]", e);
    return NextResponse.json(
      { error: "internal_error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}