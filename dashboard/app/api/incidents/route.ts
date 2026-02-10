import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows: incidents } = await pool.query(`
      SELECT i.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', e.id, 'type', e.type, 'value', e.content,
          'source', e.source, 'threat_score', e.threat_score,
          'added_at', e.created_at
        )) FILTER (WHERE e.id IS NOT NULL), '[]') AS evidence,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id, 'agent', t.agent, 'action', t.action,
          'details', t.details, 'timestamp', t.timestamp,
          'tool_used', t.tool_used
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS timeline
      FROM incidents i
      LEFT JOIN evidence e ON e.incident_id = i.id
      LEFT JOIN timeline_events t ON t.incident_id = i.id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = incidents.map((r: any) => ({
      ...r,
      cost_total: Number(r.cost_usd),
      mttr_minutes: r.resolved_at
        ? Math.round(
            (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 60000
          )
        : null,
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}
