import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function msg(e: unknown) { return e instanceof Error ? e.message : String(e); }

export async function GET(req: Request) {
  try {
    const apiBase = process.env.API_BASE_URL?.trim(); // e.g. https://nobh-api.vercel.app/api/v1
    if (!apiBase) {
      return NextResponse.json({ error: "missing_api_base" }, { status: 500 });
    }

    const jar = await cookies();
    const idToken = jar.get("id_token")?.value || "";
    const accessToken = jar.get("access_token")?.value || "";
    const token = accessToken || idToken;

    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const upstream = await fetch(`${apiBase}/residents`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    // Surface 401s (and other errors) as-is instead of masking them
    if (!upstream.ok) {
      const details = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: "upstream_failed", status: upstream.status, details },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    // upstream returns { data: [...] } — forward it directly
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    console.error("[web /api/v1/residents]", e);
    return NextResponse.json(
      { error: "internal_error", message: msg(e) },
      { status: 500 }
    );
  }
}