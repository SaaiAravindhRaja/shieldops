#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://archestra:archestra@localhost:5432/archestra",
});

// Ensure tables exist
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('P1', 'P2', 'P3', 'P4')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaging', 'investigating', 'responding', 'resolved', 'closed')),
      type TEXT NOT NULL CHECK (type IN ('phishing', 'malware', 'data_breach', 'ddos', 'unauthorized_access', 'suspicious_commit', 'anomalous_traffic', 'policy_violation', 'other')),
      source TEXT NOT NULL DEFAULT 'manual',
      assigned_agent TEXT,
      cost_usd NUMERIC(10, 4) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT NOT NULL,
      collected_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
      agent TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_evidence_incident ON evidence(incident_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_incident ON timeline_events(incident_id);
  `);
}

const server = new McpServer({
  name: "shieldops-incident-db",
  version: "1.0.0",
});

// Tool: Create Incident
server.tool(
  "create_incident",
  "Create a new security incident in the database",
  {
    title: z.string().describe("Short descriptive title of the incident"),
    description: z.string().describe("Detailed description of the incident"),
    severity: z
      .enum(["P1", "P2", "P3", "P4"])
      .describe("Severity level: P1=Critical, P2=High, P3=Medium, P4=Low"),
    type: z
      .enum([
        "phishing",
        "malware",
        "data_breach",
        "ddos",
        "unauthorized_access",
        "suspicious_commit",
        "anomalous_traffic",
        "policy_violation",
        "other",
      ])
      .describe("Type of security incident"),
    source: z
      .string()
      .describe("Source of the alert (e.g., prometheus, github, email)"),
    assigned_agent: z
      .string()
      .optional()
      .describe("Agent assigned to handle this incident"),
  },
  async ({ title, description, severity, type, source, assigned_agent }) => {
    const result = await pool.query(
      `INSERT INTO incidents (title, description, severity, type, source, assigned_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, severity, type, source, assigned_agent || null]
    );

    // Add initial timeline event
    await pool.query(
      `INSERT INTO timeline_events (incident_id, agent, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        result.rows[0].id,
        assigned_agent || "system",
        "incident_created",
        `Incident created with severity ${severity}: ${title}`,
      ]
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result.rows[0], null, 2),
        },
      ],
    };
  }
);

// Tool: Update Incident
server.tool(
  "update_incident",
  "Update an existing security incident",
  {
    id: z.string().uuid().describe("Incident UUID"),
    status: z
      .enum([
        "open",
        "triaging",
        "investigating",
        "responding",
        "resolved",
        "closed",
      ])
      .optional()
      .describe("New status"),
    severity: z
      .enum(["P1", "P2", "P3", "P4"])
      .optional()
      .describe("Updated severity"),
    assigned_agent: z.string().optional().describe("Reassign to agent"),
    cost_usd: z.number().optional().describe("Add cost in USD"),
    details: z
      .string()
      .optional()
      .describe("Details about why this update was made"),
  },
  async ({ id, status, severity, assigned_agent, cost_usd, details }) => {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
      if (status === "resolved" || status === "closed") {
        updates.push(`resolved_at = NOW()`);
      }
    }
    if (severity) {
      updates.push(`severity = $${paramCount++}`);
      values.push(severity);
    }
    if (assigned_agent) {
      updates.push(`assigned_agent = $${paramCount++}`);
      values.push(assigned_agent);
    }
    if (cost_usd !== undefined) {
      updates.push(`cost_usd = cost_usd + $${paramCount++}`);
      values.push(cost_usd);
    }
    updates.push(`updated_at = NOW()`);

    values.push(id);
    const result = await pool.query(
      `UPDATE incidents SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return {
        content: [
          { type: "text" as const, text: `Incident ${id} not found` },
        ],
      };
    }

    // Add timeline event
    await pool.query(
      `INSERT INTO timeline_events (incident_id, agent, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        id,
        assigned_agent || "system",
        "incident_updated",
        details || `Updated: ${updates.join(", ")}`,
      ]
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result.rows[0], null, 2),
        },
      ],
    };
  }
);

// Tool: Get Incident
server.tool(
  "get_incident",
  "Get full details of a security incident including evidence and timeline",
  {
    id: z.string().uuid().describe("Incident UUID"),
  },
  async ({ id }) => {
    const incidentResult = await pool.query(
      `SELECT * FROM incidents WHERE id = $1`,
      [id]
    );

    if (incidentResult.rows.length === 0) {
      return {
        content: [
          { type: "text" as const, text: `Incident ${id} not found` },
        ],
      };
    }

    const evidenceResult = await pool.query(
      `SELECT * FROM evidence WHERE incident_id = $1 ORDER BY created_at`,
      [id]
    );

    const timelineResult = await pool.query(
      `SELECT * FROM timeline_events WHERE incident_id = $1 ORDER BY timestamp`,
      [id]
    );

    const incident = {
      ...incidentResult.rows[0],
      evidence: evidenceResult.rows,
      timeline: timelineResult.rows,
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(incident, null, 2) },
      ],
    };
  }
);

// Tool: List Incidents
server.tool(
  "list_incidents",
  "List security incidents with optional filters",
  {
    status: z
      .enum([
        "open",
        "triaging",
        "investigating",
        "responding",
        "resolved",
        "closed",
      ])
      .optional()
      .describe("Filter by status"),
    severity: z
      .enum(["P1", "P2", "P3", "P4"])
      .optional()
      .describe("Filter by severity"),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Max number of results"),
  },
  async ({ status, severity, limit }) => {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (severity) {
      conditions.push(`severity = $${paramCount++}`);
      values.push(severity);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    values.push(limit);

    const result = await pool.query(
      `SELECT id, title, severity, status, type, source, assigned_agent, cost_usd, created_at, updated_at, resolved_at
       FROM incidents ${where}
       ORDER BY
         CASE severity WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 END,
         created_at DESC
       LIMIT $${paramCount}`,
      values
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { count: result.rows.length, incidents: result.rows },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Add Evidence
server.tool(
  "add_evidence",
  "Add evidence to a security incident",
  {
    incident_id: z.string().uuid().describe("Incident UUID"),
    type: z
      .string()
      .describe(
        "Type of evidence (e.g., log, screenshot, network_capture, code_snippet, email)"
      ),
    content: z.string().describe("The evidence content or data"),
    source: z
      .string()
      .describe("Where this evidence came from (e.g., github, prometheus, virustotal)"),
    collected_by: z
      .string()
      .describe("Which agent collected this evidence"),
  },
  async ({ incident_id, type, content, source, collected_by }) => {
    const result = await pool.query(
      `INSERT INTO evidence (incident_id, type, content, source, collected_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [incident_id, type, content, source, collected_by]
    );

    // Add timeline event
    await pool.query(
      `INSERT INTO timeline_events (incident_id, agent, action, details)
       VALUES ($1, $2, $3, $4)`,
      [
        incident_id,
        collected_by,
        "evidence_added",
        `${type} evidence collected from ${source}`,
      ]
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result.rows[0], null, 2),
        },
      ],
    };
  }
);

// Tool: Get Incident Stats
server.tool(
  "get_incident_stats",
  "Get aggregate statistics about incidents for dashboard display",
  {},
  async () => {
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed')) as active_incidents,
        COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) as resolved_incidents,
        COUNT(*) FILTER (WHERE severity = 'P1' AND status NOT IN ('resolved', 'closed')) as critical_active,
        ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at)) / 60)::numeric, 1) as avg_mttr_minutes,
        ROUND(SUM(cost_usd)::numeric, 2) as total_cost_usd,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as incidents_last_24h
      FROM incidents
    `);

    const bySeverity = await pool.query(`
      SELECT severity, COUNT(*) as count
      FROM incidents
      WHERE status NOT IN ('resolved', 'closed')
      GROUP BY severity
      ORDER BY CASE severity WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P4' THEN 4 END
    `);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              ...stats.rows[0],
              by_severity: bySeverity.rows,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

async function main() {
  await initDB();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ShieldOps Incident DB MCP server running");
}

main().catch(console.error);
