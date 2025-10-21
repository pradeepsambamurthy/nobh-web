// src/app/api/messages/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { cookies } from "next/headers";

// We’ll publish to a single global channel "nobh-chat" and event "new-message"
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = { text?: string };

export async function POST(req: NextRequest) {
  try {
    // Only allow if logged in
    const jar = await cookies();
    const id = jar.get("id_token")?.value || "";
    const access = jar.get("access_token")?.value || "";
    if (!id && !access) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { text } = (await req.json().catch(() => ({}))) as Payload;
    const trimmed = (text || "").trim();
    if (!trimmed) {
      return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
    }

    // lightweight identity — you already have /api/me; but to keep this route standalone,
    // we’ll read a friendly name from a cookie your callback sets: "logged_in"
    // If you prefer, fetch /api/me from client and include name/email in body.
    const displayName = jar.get("logged_in") ? undefined : undefined; // not needed now

    const msg = {
      id: crypto.randomUUID(),
      text: trimmed,
      // client can render who/when
      at: new Date().toISOString(),
      // let the client supply "from" to display; server trusts because it’s internal admin app
    };

    await pusherServer.trigger("nobh-chat", "new-message", msg);

    return NextResponse.json({ ok: true, data: msg }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[messages/send]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}