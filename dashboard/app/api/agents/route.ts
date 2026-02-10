import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ARCHESTRA_URL = process.env.ARCHESTRA_URL || "http://localhost:9000";

export async function GET() {
  try {
    const res = await fetch(`${ARCHESTRA_URL}/api/agents`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) throw new Error("archestra_unavailable");

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "archestra_unavailable" }, { status: 503 });
  }
}
