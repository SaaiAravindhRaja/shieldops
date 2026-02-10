import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totals, bySeverity, byStatus, resolved, costTotal] =
      await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed')) AS active,
                  COUNT(*) FILTER (WHERE status IN ('resolved','closed')) AS resolved
           FROM incidents`
        ),
        pool.query(
          `SELECT severity, COUNT(*) AS count FROM incidents
           WHERE status NOT IN ('resolved','closed')
           GROUP BY severity`
        ),
        pool.query(
          `SELECT status, COUNT(*) AS count FROM incidents GROUP BY status`
        ),
        pool.query(
          `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS avg_mttr
           FROM incidents WHERE resolved_at IS NOT NULL`
        ),
        pool.query(`SELECT COALESCE(SUM(cost_usd), 0) AS total FROM incidents`),
      ]);

    const t = totals.rows[0];
    const sevMap: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
    for (const r of bySeverity.rows) sevMap[r.severity] = Number(r.count);

    const statusMap: Record<string, number> = {};
    for (const r of byStatus.rows) statusMap[r.status] = Number(r.count);

    return NextResponse.json({
      activeCount: Number(t.active),
      resolvedCount: Number(t.resolved),
      totalCount: Number(t.total),
      avgMttr: Math.round(Number(resolved.rows[0].avg_mttr) || 0),
      totalCost: Number(costTotal.rows[0].total),
      threatsBlocked: Number(t.resolved),
      costSaved: Math.round(Number(costTotal.rows[0].total) * 400),
      bySeverity: sevMap,
      byStatus: statusMap,
    });
  } catch {
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}
