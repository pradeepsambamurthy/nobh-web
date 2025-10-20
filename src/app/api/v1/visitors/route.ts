import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errMessage(e: unknown) { return e instanceof Error ? e.message : String(e); }

type Visitor = { id: string; name: string; code: string; validTill: string; status: "active"|"revoked" };

function normalizeVisitors(input: any): Visitor[] {
  const arr = Array.isArray(input) ? input : Array.isArray(input?.data) ? input.data : [];
  return arr.map((v: any) => ({
    id: String(v.id ?? v._id ?? crypto.randomUUID()),
    name: String(v.name ?? "Visitor"),
    code: String(v.code ?? v.passCode ?? "CODE"),
    validTill: new Date(v.validTill ?? v.valid_until ?? Date.now() + 2*3600e3).toISOString(),
    status: (v?.status === "revoked" ? "revoked" : "active") as Visitor["status"],
  }));
}

// ---------- GET ----------
export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    const jar = await cookies();
    const token = jar.get("access_token")?.value || jar.get("id_token")?.value || "";
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // STUB
    if (!apiBase) {
      const data = normalizeVisitors([
        { id: "v1", name: "Courier",     code: "ABCD12", validTill: new Date(Date.now()+2*3600e3).toISOString(), status: "active" },
        { id: "v2", name: "Electrician", code: "ZXCV98", validTill: new Date(Date.now()-1*3600e3).toISOString(), status: "revoked" },
      ]);
      return NextResponse.json({ data }, { status: 200 });
    }

    if (apiBase.startsWith(origin)) {
      return NextResponse.json({ error: "misconfigured_api_base", details: { apiBase, origin } }, { status: 500 });
    }

    const upstream = await fetch(`${apiBase}/visitors`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream_failed", status: upstream.status, details: raw }, { status: 502 });
    }

    const data = normalizeVisitors(raw);
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "internal_error", message: errMessage(e) }, { status: 500 });
  }
}

// ---------- POST (create / revoke via ?_method=) ----------
export async function POST(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const url = new URL(req.url);
    const methodOverride = url.searchParams.get("_method") || "";
    const id = url.searchParams.get("id") || "";

    const jar = await cookies();
    const token = jar.get("access_token")?.value || jar.get("id_token")?.value || "";
    if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // STUB
    if (!apiBase) {
      if (methodOverride === "revoke") {
        if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
        return NextResponse.json({ ok: true, action: "revoked", id }, { status: 200 });
      }
      const newPass: Visitor = {
        id: `v${Math.random().toString(36).slice(2, 8)}`,
        name: "New Visitor",
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        validTill: new Date(Date.now() + 2 * 3600e3).toISOString(),
        status: "active",
      };
      return NextResponse.json({ ok: true, data: newPass }, { status: 201 });
    }

    // REAL
    if (!methodOverride) {
      const upstream = await fetch(`${apiBase}/visitors`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}), // TODO: fill with real payload from a form
      });
      const json = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return NextResponse.json({ error: "upstream_failed", status: upstream.status, details: json }, { status: 502 });
      return NextResponse.json({ ok: true, data: json }, { status: 201 });
    }

    if (methodOverride === "revoke") {
      if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
      const upstream = await fetch(`${apiBase}/visitors/${encodeURIComponent(id)}/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return NextResponse.json({ error: "upstream_failed", status: upstream.status, details: json }, { status: 502 });
      return NextResponse.json({ ok: true, id }, { status: 200 });
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "internal_error", message: errMessage(e) }, { status: 500 });
  }
}