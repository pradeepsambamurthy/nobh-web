// src/app/api/v1/visitors/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- helpers ----------
function noStore(init: ResponseInit = {}) {
  return {
    ...init,
    headers: { ...(init.headers || {}), "cache-control": "no-store" },
  };
}
function errMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export type Visitor = {
  id: string;
  name: string;
  code: string;
  validTill: string;
  status: "active" | "revoked";
};

function normalizeVisitors(input: any): Visitor[] {
  const arr = Array.isArray(input)
    ? input
    : Array.isArray(input?.data)
    ? input.data
    : [];
  return arr.map((v: any) => ({
    id: String(v.id ?? v._id ?? crypto.randomUUID()),
    name: String(v.name ?? "Visitor"),
    code: String(v.code ?? v.passCode ?? "CODE"),
    validTill: new Date(
      v.validTill ?? v.valid_until ?? Date.now() + 2 * 3600e3
    ).toISOString(),
    status: (v?.status === "revoked" ? "revoked" : "active") as Visitor["status"],
  }));
}

// ---------- GET /api/v1/visitors ----------
export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    const jar = await cookies();
    const token =
      jar.get("access_token")?.value || jar.get("id_token")?.value || "";
    if (!token) return NextResponse.json({ error: "unauthorized" }, noStore({ status: 401 }));

    // STUB: when API_BASE_URL is not configured, serve example data
    if (!apiBase) {
      const data = normalizeVisitors([
        {
          id: "v1",
          name: "Courier",
          code: "ABCD12",
          validTill: new Date(Date.now() + 2 * 3600e3).toISOString(),
          status: "active",
        },
        {
          id: "v2",
          name: "Electrician",
          code: "ZXCV98",
          validTill: new Date(Date.now() - 1 * 3600e3).toISOString(),
          status: "revoked",
        },
      ]);
      return NextResponse.json({ data }, noStore({ status: 200 }));
    }

    // Avoid infinite loop if API_BASE_URL points to this same app
    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        { error: "misconfigured_api_base", details: { apiBase, origin } },
        noStore({ status: 500 })
      );
    }

    const upstream = await fetch(`${apiBase}/visitors`, {
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

    const data = normalizeVisitors(raw);
    return NextResponse.json({ data }, noStore({ status: 200 }));
  } catch (e) {
    return NextResponse.json(
      { error: "internal_error", message: errMessage(e) },
      noStore({ status: 500 })
    );
  }
}

// ---------- POST /api/v1/visitors ----------
//  - Create pass:         POST /api/v1/visitors
//  - Revoke existing:     POST /api/v1/visitors?_method=revoke&id=<id>
export async function POST(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const url = new URL(req.url);
    const methodOverride = url.searchParams.get("_method") || "";
    const id = url.searchParams.get("id") || "";

    const jar = await cookies();
    const token =
      jar.get("access_token")?.value || jar.get("id_token")?.value || "";
    if (!token) return NextResponse.json({ error: "unauthorized" }, noStore({ status: 401 }));

    // ====== STUB MODE ======
    if (!apiBase) {
      if (methodOverride === "revoke") {
        if (!id) return NextResponse.json({ error: "missing_id" }, noStore({ status: 400 }));
        return NextResponse.json({ ok: true, action: "revoked", id }, noStore({ status: 200 }));
      }
      // Create: return array shape for consistency
      const newPass: Visitor = {
        id: `v${Math.random().toString(36).slice(2, 8)}`,
        name: "New Visitor",
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        validTill: new Date(Date.now() + 2 * 3600e3).toISOString(),
        status: "active",
      };
      return NextResponse.json({ ok: true, data: [newPass] }, noStore({ status: 201 }));
    }

    // ====== REAL API ======
    // Create
    if (!methodOverride) {
      const upstream = await fetch(`${apiBase}/visitors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // TODO: pass real payload from your form
        body: JSON.stringify({}),
        cache: "no-store",
      });

      const raw = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: "upstream_failed", status: upstream.status, details: raw },
          noStore({ status: 502 })
        );
      }

      // Normalize to array for consistent shape
      const created = normalizeVisitors(raw);
      return NextResponse.json({ ok: true, data: created }, noStore({ status: 201 }));
    }

    // Revoke
    if (methodOverride === "revoke") {
      if (!id) return NextResponse.json({ error: "missing_id" }, noStore({ status: 400 }));

      const upstream = await fetch(
        `${apiBase}/visitors/${encodeURIComponent(id)}/revoke`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const raw = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: "upstream_failed", status: upstream.status, details: raw },
          noStore({ status: 502 })
        );
      }

      // Keeping revoke response simple; UI only needs success + id.
      return NextResponse.json({ ok: true, id }, noStore({ status: 200 }));
    }

    return NextResponse.json({ error: "unknown_action" }, noStore({ status: 400 }));
  } catch (e) {
    return NextResponse.json(
      { error: "internal_error", message: errMessage(e) },
      noStore({ status: 500 })
    );
  }
}