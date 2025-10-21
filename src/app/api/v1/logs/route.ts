import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Always add no-store */
const noStore = (init: ResponseInit = {}) => ({
  ...init,
  headers: { ...(init.headers || {}), "Cache-Control": "no-store" },
});

/** Defensive array normalizer */
function toArray<T = any>(input: any): T[] {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.data)) return input.data as T[];
  return [];
}

function errMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

type Log = { id: string; time: string; unit: string; event: string };

export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    const store = await cookies();
    const token = store.get("access_token")?.value || store.get("id_token")?.value || "";
    if (!token) return NextResponse.json({ error: "unauthorized" }, noStore({ status: 401 }));

    // Stub
    if (!apiBase) {
      const data: Log[] = [
        { id: "l1", time: "2025-10-16T10:05:00Z", unit: "A-101", event: "Visitor Entry" },
        { id: "l2", time: "2025-10-16T11:20:00Z", unit: "B-203", event: "Package Delivered" },
      ];
      return NextResponse.json({ data }, noStore({ status: 200 }));
    }

    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        { error: "misconfigured_api_base", details: { apiBase, origin } },
        noStore({ status: 500 })
      );
    }

    const upstream = await fetch(`${apiBase}/logs`, {
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

    const data = toArray<Log>(raw);
    return NextResponse.json({ data }, noStore({ status: 200 }));
  } catch (e) {
    return NextResponse.json(
      { error: "internal_error", message: errMessage(e) },
      noStore({ status: 500 })
    );
  }
}