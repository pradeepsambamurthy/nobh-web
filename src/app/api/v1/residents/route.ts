import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    // Require presence of a token (don’t hard-verify against JWKS for now)
    const store = await cookies();
    const idToken = store.get("id_token")?.value;
    const accessToken = store.get("access_token")?.value;
    if (!idToken && !accessToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // If no upstream configured, return stub (works on Vercel too)
    if (!apiBase) {
      return NextResponse.json({
        data: [
          { id: "r1", name: "John Doe",  unit: "A-101", phone: "+1 555-1111" },
          { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
          { id: "r3", name: "Ravi Kumar", unit: "C-307", phone: "+1 555-3333" },
        ],
      });
    }

    // Safety: prevent recursion
    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        { error: "misconfigured_api_base", details: { apiBase, origin } },
        { status: 500 }
      );
    }

    // Upstream call (if you wire a real API later)
    const resp = await fetch(`${apiBase}/residents`, {
      headers: { Authorization: `Bearer ${accessToken ?? idToken ?? ""}` },
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
    return NextResponse.json({ data });
  } catch (e: any) {
    console.error("[GET /api/v1/residents]", e);
    return NextResponse.json(
      { error: "internal_error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}