
import { NextRequest, NextResponse } from "next/server";

// Safe mock when no backend is configured (dev or prod)
function mockResidents() {
  return NextResponse.json({
    data: [
      { id: "r1", name: "John Doe",  unit: "A-101", phone: "+1 555-1111" },
      { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
      { id: "r3", name: "Ravi Kumar", unit: "C-307" },
    ],
  });
}

export async function GET(req: NextRequest) {
  // No backend configured? Serve mock.
  if (!process.env.API_BASE_URL) return mockResidents();

  const accessToken = req.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${process.env.API_BASE_URL}/residents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      return NextResponse.json({ error: "upstream_failed", details: t }, { status: 502 });
    }

    const data = await upstream.json(); // shape: { data: [...] } or adjust if different
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: "proxy_exception", message: String(e) },
      { status: 500 }
    );
  }
}