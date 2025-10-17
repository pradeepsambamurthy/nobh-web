import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errMessage(e: unknown) { return e instanceof Error ? e.message : String(e); }

// ---------- GET: list visitors ----------
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

    // Stub aligned to your UI shape
    // UI expects: { id, name, code, validTill, status }
    if (!apiBase) {
      return NextResponse.json({
        data: [
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
        ] as Array<{ id: string; name: string; code: string; validTill: string; status: "active" | "revoked" }>,
      });
    }

    // Safety: avoid recursion if API_BASE_URL points to this app
    if (apiBase.startsWith(origin)) {
      return NextResponse.json(
        { error: "misconfigured_api_base", details: { apiBase, origin } },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${apiBase}/visitors`, {
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

// ---------- POST: create / revoke ----------
export async function POST(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim();
    const url = new URL(req.url);
    const methodOverride = url.searchParams.get("_method") || ""; // revoke path
    const id = url.searchParams.get("id") || "";

    const store = await cookies();
    const idToken = store.get("id_token")?.value || "";
    const accessToken = store.get("access_token")?.value || "";

    if (!idToken && !accessToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ---- STUB BEHAVIOR (no API_BASE_URL) ----
    if (!apiBase) {
      if (methodOverride === "revoke") {
        if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
        // pretend we revoked successfully
        return NextResponse.json({ ok: true, action: "revoked", id }, { status: 200 });
      }
      // create a new stub pass
      const newPass = {
        id: `v${Math.random().toString(36).slice(2, 8)}`,
        name: "New Visitor",
        code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        validTill: new Date(Date.now() + 2 * 3600e3).toISOString(),
        status: "active" as const,
      };
      return NextResponse.json({ ok: true, data: newPass }, { status: 201 });
    }

    // ---- REAL UPSTREAM ----
    if (!methodOverride) {
      // Create
      const upstream = await fetch(`${apiBase}/visitors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken || idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ /* include real payload when your UI collects it */ }),
      });
      const json = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: "upstream_failed", status: upstream.status, details: json },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true, data: json }, { status: 201 });
    }

    if (methodOverride === "revoke") {
      if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
      const upstream = await fetch(`${apiBase}/visitors/${encodeURIComponent(id)}/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken || idToken}` },
      });
      const json = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: "upstream_failed", status: upstream.status, details: json },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true, id }, { status: 200 });
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "internal_error", message: errMessage(e) },
      { status: 500 }
    );
  }
}