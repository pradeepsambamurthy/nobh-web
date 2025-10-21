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

type Visitor = {
  id: string;
  name: string;
  code: string;
  validTill: string;
  status: "active" | "revoked";
};

// ---------- GET ----------
export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const { origin } = new URL(req.url);

    const jar = await cookies();
    const token = jar.get("access_token")?.value || jar.get("id_token")?.value || "";
    if (!token) return NextResponse.json({ error: "unauthorized" }, noStore({ status: 401 }));

    // Stub
    if (!apiBase) {
      const data: Visitor[] = [
        { id: "v1", name: "Courier",     code: "ABCD12", validTill: new Date(Date.now() + 2 * 3600e3).toISOString(), status: "active" },
        { id: "v2", name: "Electrician", code: "ZXCV98", validTill: new Date(Date.now() - 1 * 3600e3).toISOString(), status: "revoked" },
      ];
      return NextResponse.json({ data }, noStore({ status: 200 }));
    }

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

    const data = toArray<Visitor>(raw);
    return NextResponse.json({ data }, noStore({ status: 200 }));
  } catch (e) {
    return NextResponse.json(
      { error: "internal_error", message: errMessage(e) },
      noStore({ status: 500 })
    );
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
    if (!token) return NextResponse.json({ error: "unauthorized" }, noStore({ status: 401 }));

    // Stub
    if (!apiBase) {
      if (methodOverride === "revoke") {
        if (!id) return NextResponse.json({ error: "missing_id" }, noStore({ status: 400 }));
        return NextResponse.json({ ok: true, action: "revoked", id }, noStore({ status: 200 }));
      }
      const newPass: Visitor = {
        id: `v${Math.random().toString(36).slice(2, 8)}`,
        name: "New Visitor",
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        validTill: new Date(Date.now() + 2 * 3600e3).toISOString(),
        status: "active",
      };
      // ✅ Return array to keep shape consistent
      return NextResponse.json({ ok: true, data: [newPass] }, noStore({ status: 201 }));
    }

    // Real create
    if (!methodOverride) {
      const upstream = await fetch(`${apiBase}/visitors`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}), // TODO: replace with form payload
      });
      const json = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: "upstream_failed", status: upstream.status, details: json },
          noStore({ status: 502 })
        );
      }
      return NextResponse.json({ ok: true, data: toArray<Visitor>(json) }, noStore({ status: 201 }));
    }

    // Real revoke
    if (methodOverride === "revoke") {
      if (!id) return NextResponse.json({ error: "missing_id" }, noStore({ status: 400 }));
      const upstream = await fetch(`${apiBase}/visitors/${encodeURIComponent(id)}/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: "upstream_failed", status: upstream.status, details: json },
          noStore({ status: 502 })
        );
      }
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