
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  // Dev mock if no backend yet
  if (process.env.NODE_ENV === "development" && !process.env.API_BASE_URL) {
    return NextResponse.json({
      data: [
        { id: "r1", name: "John Doe", unit: "A-101", phone: "+1 555-1111" },
        { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
        { id: "r3", name: "Ravi Kumar", unit: "C-307" },
      ],
    });
  }

  const accessToken = req.cookies.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const upstream = await fetch(`${process.env.API_BASE_URL}/residents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      return NextResponse.json({ error: "upstream_failed", details: t }, { status: 502 });
    }

    const data: unknown = await upstream.json();
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "proxy_exception", message }, { status: 500 });
  }
}