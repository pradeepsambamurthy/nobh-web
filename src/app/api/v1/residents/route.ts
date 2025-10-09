import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // ✅ If API_BASE_URL not set, return mock residents
    if (!process.env.API_BASE_URL || process.env.API_BASE_URL.trim() === "") {
      return NextResponse.json({
        data: [
          { id: "r1", name: "John Doe", unit: "A-101", phone: "+1 555-1111" },
          { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
          { id: "r3", name: "Ravi Kumar", unit: "C-307", phone: "+1 555-3333" },
        ],
      });
    }

    const accessToken = req.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 🔗 Try calling your backend only if API_BASE_URL exists
    const upstream = await fetch(`${process.env.API_BASE_URL}/residents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: "upstream_failed", details: text },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: "internal_error", message: e.message || String(e) },
      { status: 500 }
    );
  }
}