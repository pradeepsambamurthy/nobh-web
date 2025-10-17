import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errMessage(e: unknown) { return e instanceof Error ? e.message : String(e); }

export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    const store = await cookies();
    const idToken = store.get("id_token")?.value || "";
    const accessToken = store.get("access_token")?.value || "";

    if (!idToken && !accessToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!apiBase) {
      // Stub shape
      return NextResponse.json({
        data: [
          { id: "a1", title: "Water Maintenance", date: "2025-10-20", desc: "9AM–12PM" },
          { id: "a2", title: "Diwali Event",      date: "2025-10-24", desc: "6PM Clubhouse" },
        ],
      });
    }

    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        { error: "misconfigured_api_base", details: { apiBase, origin } },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${apiBase}/announcements`, {
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
    return NextResponse.json(
      { error: "internal_error", message: errMessage(e) },
      { status: 500 }
    );
  }
}