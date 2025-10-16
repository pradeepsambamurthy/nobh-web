import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyIdToken } from "@/lib/verifyIdToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim() || "";
    const { origin } = new URL(req.url);

    const idToken = (await cookies()).get("id_token")?.value;
    if (!idToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Throws if invalid/expired/wrong audience
    const claims = await verifyIdToken(idToken);
    // Optional RBAC: ensure group
    // if (!claims["cognito:groups"]?.includes("admin")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    if (!apiBase) {
      return NextResponse.json({
        data: [
          { id: "r1", name: "John Doe",  unit: "A-101", phone: "+1 555-1111" },
          { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
          { id: "r3", name: "Ravi Kumar", unit: "C-307", phone: "+1 555-3333" },
        ],
      }, { headers: { "cache-control": "no-store" }});
    }

    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        { error: "misconfigured_api_base", message: "API_BASE_URL points to this app.", details: { apiBase, origin } },
        { status: 500 }
      );
    }

    // You can forward the access token if your upstream expects it:
    const accessToken = (await cookies()).get("access_token")?.value ?? "";
    const resp = await fetch(`${apiBase}/residents`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: "upstream_failed", status: resp.status, details: text }, { status: 502 });
    }

    const data = await resp.json();
    return NextResponse.json({ data }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    console.error("[GET /api/v1/residents]", e);
    return NextResponse.json({ error: "internal_error", message: e?.message ?? String(e) }, { status: 500 });
  }
}