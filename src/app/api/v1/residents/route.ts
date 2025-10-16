import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const store = await cookies();
    const idToken = store.get("id_token")?.value;
    const accessToken = store.get("access_token")?.value;

    // Require login (cookie check)
    if (!idToken && !accessToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ✅ Return hardcoded stub data (no external API calls)
    const data = [
      { id: "r1", name: "John Doe", unit: "A-101", phone: "+1 555-1111" },
      { id: "r2", name: "Jane Smith", unit: "B-203", phone: "+1 555-2222" },
      { id: "r3", name: "Ravi Kumar", unit: "C-307", phone: "+1 555-3333" },
    ];

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/v1/residents]", err);
    return NextResponse.json(
      { error: "internal_error", message: err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}