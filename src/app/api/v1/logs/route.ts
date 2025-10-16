import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __LOGS__?: any[] };
if (!g.__LOGS__) {
  g.__LOGS__ = [
    {
      id: "l1",
      visitor: "Electrician",
      resident: "John Doe",
      time: new Date().toISOString(),
      status: "Checked In",
    },
    {
      id: "l2",
      visitor: "Courier",
      resident: "Jane Smith",
      time: new Date(Date.now() - 7200000).toISOString(),
      status: "Checked Out",
    },
  ];
}
const LOGS = g.__LOGS__!;

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get("id_token")?.value;
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    return NextResponse.json({ data: LOGS });
  } catch (e: any) {
    console.error("[GET /api/v1/logs]", e);
    return NextResponse.json(
      { error: "internal_error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}