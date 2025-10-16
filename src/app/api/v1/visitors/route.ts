import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Visitor = {
  id: string;
  name: string;
  code: string;
  validTill: string;
  status: "active" | "revoked";
};

// HMR-safe in-memory store
const g = globalThis as unknown as { __VISITORS__?: Visitor[] };
if (!g.__VISITORS__) {
  g.__VISITORS__ = [
    { id: "v1", name: "Electrician", code: "ABCD12",
      validTill: new Date(Date.now() + 2 * 3600e3).toISOString(), status: "active" },
    { id: "v2", name: "Courier", code: "PQRS98",
      validTill: new Date(Date.now() + 1 * 3600e3).toISOString(), status: "active" },
  ];
}
const VISITORS = g.__VISITORS__ as Visitor[];

export async function GET(req: Request) {
  try {
    const store = await cookies();
    const idToken = store.get("id_token")?.value;
    if (!idToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    return NextResponse.json(
      { data: VISITORS },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[GET /api/v1/visitors] fatal:", e?.stack || e);
    return NextResponse.json(
      { error: "internal_error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const store = await cookies();
    const idToken = store.get("id_token")?.value;
    if (!idToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const methodOverride =
      url.searchParams.get("_method") || (await tryFormField(req, "_method"));

    if (methodOverride === "revoke") {
      const vid = url.searchParams.get("id") || (await tryFormField(req, "id"));
      if (!vid) {
        return NextResponse.json({ error: "bad_request", field: "id" }, { status: 400 });
      }
      for (let i = 0; i < VISITORS.length; i++) {
        if (VISITORS[i].id === vid) {
          VISITORS[i] = { ...VISITORS[i], status: "revoked" };
          break;
        }
      }
      return NextResponse.redirect("/visitors");
    }

    // create pass
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    VISITORS.unshift({
      id: "v" + Date.now().toString(36),
      name: "Guest",
      code,
      validTill: new Date(Date.now() + 4 * 3600e3).toISOString(),
      status: "active",
    });

    return NextResponse.redirect("/visitors");
  } catch (e: any) {
    console.error("[POST /api/v1/visitors] fatal:", e?.stack || e);
    return NextResponse.json(
      { error: "internal_error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

async function tryFormField(req: Request, k: string) {
  try {
    const form = await req.formData();
    return form.get(k)?.toString() ?? null;
  } catch {
    return null;
  }
}