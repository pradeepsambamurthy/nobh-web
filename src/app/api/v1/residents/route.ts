import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim() || "";
    const { origin } = new URL(req.url);

    // --- Auth: require access token for this endpoint ---
    const accessToken = (await cookies()).get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // --- If no upstream configured, return stub data (still auth-protected) ---
    if (!apiBase) {
      return NextResponse.json({
        data: [
          { id: "r1", name: "John Doe",  unit: "A-101", phone: "+1 555-1111" },
          { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
          { id: "r3", name: "Ravi Kumar", unit: "C-307", phone: "+1 555-3333" },
        ],
      });
    }

    // --- Safety: prevent accidental recursion if API_BASE_URL points to this app ---
    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        {
          error: "misconfigured_api_base",
          message: "API_BASE_URL points to this app and would cause recursion.",
          details: { apiBase, origin },
        },
        { status: 500 }
      );
    }

    // --- Upstream call ---
    const resp = await fetch(`${apiBase}/residents`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: "upstream_failed", status: resp.status, details: text },
        { status: 502 }
      );
    }

    const data = await resp.json();
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    console.error("[GET /api/v1/residents]", e);
    return NextResponse.json(
      { error: "internal_error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}