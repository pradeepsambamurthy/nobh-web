import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errMessage(e: unknown) { return e instanceof Error ? e.message : String(e); }

export async function GET(req: Request) {
  try {
    console.log("[residents] API_BASE_URL =", process.env.API_BASE_URL);
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    const store = await cookies();
    const idToken = store.get("id_token")?.value || "";
    const accessToken = store.get("access_token")?.value || "";

    if (!idToken && !accessToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!apiBase) {
      return NextResponse.json({
        data: [
          { id: "r1", name: "John Doe",  unit: "A-101", phone: "+1 555-1111" },
          { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
          { id: "r3", name: "Ravi Kumar", unit: "C-307", phone: "+1 555-3333" },
        ],
      });
    }

    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        { error: "misconfigured_api_base", details: { apiBase, origin } },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${apiBase}/residents`, {
      headers: { Authorization: `Bearer ${accessToken || idToken}` },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: "upstream_failed", status: upstream.status, details: text },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: unknown) {
    console.error("[GET /api/v1/residents]", e);
    return NextResponse.json(
      { error: "internal_error", message: errMessage(e) },
      { status: 500 }
    );
  }
}