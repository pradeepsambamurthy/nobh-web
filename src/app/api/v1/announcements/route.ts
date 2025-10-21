import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Always add no-store */
const noStore = (init: ResponseInit = {}) => ({
  ...init,
  headers: { ...(init.headers || {}), "Cache-Control": "no-store" },
});

/** Defensive array normalizer: accepts [], {data: []}, anything else → [] */
function toArray<T = any>(input: any): T[] {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.data)) return input.data as T[];
  return [];
}

function errMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

type Ann = { id: string; title: string; body: string; createdAt: string; pinned?: boolean };

export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    const jar = await cookies();
    const token = jar.get("access_token")?.value || jar.get("id_token")?.value || "";
    if (!token) return NextResponse.json({ error: "unauthorized" }, noStore({ status: 401 }));

    // ---- Stub (no external API configured) ----
    if (!apiBase) {
      const data: Ann[] = [
        { id: "a1", title: "Water Maintenance", body: "9AM–12PM", createdAt: new Date().toISOString(), pinned: true },
        { id: "a2", title: "Diwali Event", body: "6PM Clubhouse", createdAt: new Date(Date.now() - 864e5).toISOString() },
      ];
      return NextResponse.json({ data }, noStore({ status: 200 }));
    }

    // Avoid loop if API_BASE_URL accidentally points to this app
    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        { error: "misconfigured_api_base", details: { apiBase, origin } },
        noStore({ status: 500 })
      );
    }

    const upstream = await fetch(`${apiBase}/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream_failed", status: upstream.status, details: raw },
        noStore({ status: 502 })
      );
    }

    const data = toArray<Ann>(raw);
    return NextResponse.json({ data }, noStore({ status: 200 }));
  } catch (e) {
    return NextResponse.json(
      { error: "internal_error", message: errMessage(e) },
      noStore({ status: 500 })
    );
  }
}