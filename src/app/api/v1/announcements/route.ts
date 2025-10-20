import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errMessage(e: unknown) { return e instanceof Error ? e.message : String(e); }

type Ann = { id: string; title: string; body: string; createdAt: string; pinned?: boolean };

// Normalize anything we get into the UI’s expected shape
function normalizeAnnouncements(input: any): Ann[] {
  const arr = Array.isArray(input) ? input : Array.isArray(input?.data) ? input.data : [];
  return arr.map((a: any) => ({
    id: String(a.id ?? a._id ?? crypto.randomUUID()),
    title: String(a.title ?? a.subject ?? "Announcement"),
    body: String(a.body ?? a.desc ?? a.message ?? ""),
    createdAt: new Date(a.createdAt ?? a.date ?? Date.now()).toISOString(),
    pinned: Boolean(a.pinned ?? a.isPinned ?? false),
  }));
}

export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    const jar = await cookies();
    const token = jar.get("access_token")?.value || jar.get("id_token")?.value || "";

    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // ---- STUB (no API) ----
    if (!apiBase) {
      const data = normalizeAnnouncements([
        { id: "a1", title: "Water Maintenance", body: "9AM–12PM", createdAt: new Date().toISOString(), pinned: true },
        { id: "a2", title: "Diwali Event", body: "6PM Clubhouse", createdAt: new Date(Date.now()-864e5).toISOString() },
      ]);
      return NextResponse.json({ data }, { status: 200 });
    }

    // avoid infinite loop
    if (apiBase.startsWith(origin)) {
      return NextResponse.json({ error: "misconfigured_api_base", details: { apiBase, origin } }, { status: 500 });
    }

    const upstream = await fetch(`${apiBase}/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream_failed", status: upstream.status, details: raw }, { status: 502 });
    }

    const data = normalizeAnnouncements(raw);
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "internal_error", message: errMessage(e) }, { status: 500 });
  }
}