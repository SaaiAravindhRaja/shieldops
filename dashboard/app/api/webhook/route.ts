import { NextRequest } from "next/server";
import { executeMcpTool } from "@/lib/mcp-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhook/alert
 *
 * Accepts alerts from Prometheus AlertManager, Grafana, PagerDuty,
 * or generic JSON payloads. Auto-creates incidents via the MCP engine.
 *
 * Supported formats:
 * - Prometheus AlertManager: { alerts: [{ labels: {}, annotations: {} }] }
 * - Generic: { title, severity?, type?, source?, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incidents: Array<Record<string, unknown>> = [];

    // Prometheus AlertManager format
    if (body.alerts && Array.isArray(body.alerts)) {
      for (const alert of body.alerts) {
        const result = await executeMcpTool({
          server: "incident-db",
          tool: "create_incident",
          params: {
            title: alert.annotations?.summary || alert.labels?.alertname || "Prometheus Alert",
            description: alert.annotations?.description || JSON.stringify(alert.labels),
            severity: mapPrometheusSeverity(alert.labels?.severity),
            type: mapAlertType(alert.labels?.alertname),
            source: `prometheus:${alert.labels?.alertname || "unknown"}`,
          },
        });
        incidents.push(result.result);
      }
    }
    // Generic format
    else if (body.title) {
      const result = await executeMcpTool({
        server: "incident-db",
        tool: "create_incident",
        params: {
          title: body.title,
          description: body.description || body.title,
          severity: body.severity || "P3",
          type: body.type || "other",
          source: body.source || "webhook",
        },
      });
      incidents.push(result.result);
    }
    else {
      return Response.json(
        { error: "Unrecognized payload format", accepted_formats: ["prometheus_alertmanager", "generic"] },
        { status: 400 },
      );
    }

    return Response.json({
      accepted: true,
      incidents_created: incidents.length,
      incidents,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      { error: "webhook_processing_failed", message: String(err) },
      { status: 500 },
    );
  }
}

function mapPrometheusSeverity(sev?: string): string {
  switch (sev) {
    case "critical": return "P1";
    case "warning": return "P2";
    case "info": return "P3";
    default: return "P3";
  }
}

function mapAlertType(name?: string): string {
  if (!name) return "other";
  const lower = name.toLowerCase();
  if (lower.includes("brute") || lower.includes("auth")) return "unauthorized_access";
  if (lower.includes("malware") || lower.includes("virus")) return "malware";
  if (lower.includes("ddos") || lower.includes("traffic")) return "ddos";
  if (lower.includes("phish")) return "phishing";
  if (lower.includes("exfil") || lower.includes("breach")) return "data_breach";
  return "anomalous_traffic";
}
