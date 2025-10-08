import { NextRequest, NextResponse } from "next/server";

function decodeJwt<T=any>(jwt: string): T | null {
  try {
    const b64 = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const id = req.cookies.get("id_token")?.value;
  if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const claims = decodeJwt(id);
  return NextResponse.json({
    email: claims?.email,
    name: claims?.name,
    sub: claims?.sub,
    groups: claims?.["cognito:groups"] || [],
  });
}