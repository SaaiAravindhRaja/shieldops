#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "shieldops-security-playbook",
  version: "1.0.0",
});

// In-memory action log for tracking what's been done
const actionLog: Array<{
  id: string;
  action: string;
  target: string;
  status: string;
  timestamp: string;
  details: Record<string, unknown>;
}> = [];

function logAction(
  action: string,
  target: string,
  status: string,
  details: Record<string, unknown> = {}
) {
  const entry = {
    id: crypto.randomUUID(),
    action,
    target,
    status,
    timestamp: new Date().toISOString(),
    details,
  };
  actionLog.push(entry);
  return entry;
}

// Tool: Block IP Address
server.tool(
  "block_ip",
  "Block an IP address at the firewall/WAF level to prevent further access",
  {
    ip: z.string().optional().describe("IP address to block"),
    ips: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .describe("Multiple IPs to block"),
    reason: z.string().describe("Reason for blocking"),
    duration_hours: z
      .number()
      .optional()
      .default(24)
      .describe("How long to block (hours, 0 = permanent)"),
    incident_id: z
      .string()
      .optional()
      .describe("Associated incident ID for audit trail"),
  }
  .refine((data) => data.ip || data.ips, {
    message: "Provide ip or ips",
    path: ["ip"],
  }),
  async ({ ip, ips, reason, duration_hours, incident_id }) => {
    const ipList = Array.isArray(ips)
      ? ips
      : typeof ips === "string"
        ? ips.split(",").map((value) => value.trim()).filter(Boolean)
        : ip
          ? [ip]
          : [];
    // Simulate firewall rule creation
    const entry = logAction("block_ip", ipList.join(", "), "executed", {
      reason,
      duration_hours,
      incident_id,
      firewall_rule_id: `fw-${crypto.randomUUID().slice(0, 8)}`,
      expires_at:
        duration_hours > 0
          ? new Date(
              Date.now() + duration_hours * 3600000
            ).toISOString()
          : "never",
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              action_type: "block_ip",
              ip: ipList,
              message: `IP${ipList.length > 1 ? "s" : ""} ${ipList.join(", ")} has been blocked for ${duration_hours === 0 ? "permanently" : `${duration_hours} hours`}`,
              audit: entry,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Isolate Kubernetes Pod
server.tool(
  "isolate_pod",
  "Isolate a compromised Kubernetes pod by applying network policies to prevent lateral movement",
  {
    pod_name: z.string().describe("Name of the pod to isolate"),
    namespace: z
      .string()
      .optional()
      .default("default")
      .describe("Kubernetes namespace"),
    reason: z.string().describe("Reason for isolation"),
    incident_id: z.string().optional().describe("Associated incident ID"),
  },
  async ({ pod_name, namespace, reason, incident_id }) => {
    const networkPolicy = {
      apiVersion: "networking.k8s.io/v1",
      kind: "NetworkPolicy",
      metadata: {
        name: `isolate-${pod_name}`,
        namespace,
        labels: {
          "shieldops.io/isolation": "true",
          "shieldops.io/incident": incident_id || "unknown",
        },
      },
      spec: {
        podSelector: { matchLabels: { app: pod_name } },
        policyTypes: ["Ingress", "Egress"],
        ingress: [],
        egress: [],
      },
    };

    const entry = logAction("isolate_pod", `${namespace}/${pod_name}`, "executed", {
      reason,
      incident_id,
      network_policy: networkPolicy,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              action_type: "isolate_pod",
              pod: `${namespace}/${pod_name}`,
              message: `Pod ${pod_name} in namespace ${namespace} has been isolated. All ingress and egress traffic blocked.`,
              network_policy_applied: networkPolicy.metadata.name,
              audit: entry,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Isolate Host
server.tool(
  "isolate_host",
  "Isolate a compromised workstation or server from the network",
  {
    host: z.string().describe("Hostname or asset ID to isolate"),
    reason: z.string().describe("Reason for isolation"),
    preserve_evidence: z
      .boolean()
      .optional()
      .default(true)
      .describe("Capture forensic snapshot before isolation"),
    incident_id: z.string().optional().describe("Associated incident ID"),
  },
  async ({ host, reason, preserve_evidence, incident_id }) => {
    const entry = logAction("isolate_host", host, "executed", {
      reason,
      incident_id,
      preserve_evidence,
      actions_taken: [
        "Network access revoked",
        preserve_evidence ? "Forensic snapshot initiated" : "Snapshot skipped",
        "Endpoint containment policy applied",
      ],
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              action_type: "isolate_host",
              host,
              message: `Host ${host} has been isolated from the network`,
              audit: entry,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Revoke Token/Session
server.tool(
  "revoke_token",
  "Revoke an API token, session token, or OAuth token to prevent unauthorized access",
  {
    token_type: z
      .enum(["api_key", "session", "oauth", "jwt", "service_account"])
      .describe("Type of token to revoke"),
    identifier: z
      .string()
      .describe(
        "Token identifier (token ID, session ID, service account name)"
      ),
    reason: z.string().describe("Reason for revocation"),
    incident_id: z.string().optional().describe("Associated incident ID"),
  },
  async ({ token_type, identifier, reason, incident_id }) => {
    const entry = logAction(
      "revoke_token",
      `${token_type}:${identifier}`,
      "executed",
      {
        reason,
        incident_id,
        token_type,
        revoked_at: new Date().toISOString(),
      }
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              action_type: "revoke_token",
              token_type,
              identifier,
              message: `${token_type} token "${identifier}" has been revoked`,
              audit: entry,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Quarantine User Account
server.tool(
  "quarantine_user",
  "Quarantine a user account by disabling login and revoking all active sessions",
  {
    user_id: z.string().describe("User identifier (email, username, or ID)"),
    reason: z.string().describe("Reason for quarantine"),
    preserve_data: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether to preserve user data (true) or wipe sessions only"),
    incident_id: z.string().optional().describe("Associated incident ID"),
  },
  async ({ user_id, reason, preserve_data, incident_id }) => {
    const entry = logAction("quarantine_user", user_id, "executed", {
      reason,
      incident_id,
      preserve_data,
      actions_taken: [
        "Login disabled",
        "All active sessions revoked",
        "MFA tokens reset",
        preserve_data
          ? "User data preserved"
          : "Session data cleared",
      ],
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              action_type: "quarantine_user",
              user_id,
              message: `User ${user_id} has been quarantined. Login disabled, sessions revoked.`,
              audit: entry,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Execute Playbook
server.tool(
  "execute_playbook",
  "Execute a predefined security response playbook for a specific incident type",
  {
    playbook: z
      .enum([
        "ransomware_response",
        "data_breach_response",
        "ddos_mitigation",
        "phishing_response",
        "insider_threat",
        "compromised_credentials",
        "supply_chain_remediation",
      ])
      .describe("Playbook to execute"),
    incident_id: z.string().describe("Associated incident ID"),
    target: z
      .string()
      .describe(
        "Primary target of the playbook (affected system, IP, user, etc.)"
      ),
    auto_approve: z
      .boolean()
      .optional()
      .default(false)
      .describe("Auto-approve all actions (use with caution)"),
  },
  async ({ playbook, incident_id, target, auto_approve }) => {
    const playbooks: Record<
      string,
      { name: string; steps: string[]; severity: string }
    > = {
      ransomware_response: {
        name: "Ransomware Response",
        severity: "P1",
        steps: [
          "Isolate affected systems from network",
          "Identify ransomware variant and encryption method",
          "Check for backup integrity and availability",
          "Preserve forensic evidence (memory dumps, disk images)",
          "Notify CISO and legal team",
          "Engage incident response retainer (if available)",
          "Begin recovery from clean backups",
          "Conduct post-incident review",
        ],
      },
      data_breach_response: {
        name: "Data Breach Response",
        severity: "P1",
        steps: [
          "Identify scope of data exposure",
          "Contain the breach (revoke access, patch vulnerability)",
          "Preserve evidence for forensic analysis",
          "Assess regulatory notification requirements (GDPR, CCPA, HIPAA)",
          "Notify affected users within required timeframe",
          "Engage legal counsel",
          "File regulatory notifications",
          "Implement additional monitoring",
        ],
      },
      ddos_mitigation: {
        name: "DDoS Mitigation",
        severity: "P2",
        steps: [
          "Identify attack vector (volumetric, protocol, application layer)",
          "Enable rate limiting on affected endpoints",
          "Activate CDN/WAF DDoS protection rules",
          "Block top attacking IPs at firewall",
          "Scale infrastructure if needed",
          "Monitor for attack pattern changes",
          "Document attack metrics for post-incident review",
        ],
      },
      phishing_response: {
        name: "Phishing Response",
        severity: "P2",
        steps: [
          "Quarantine the phishing email across all mailboxes",
          "Identify users who clicked malicious links",
          "Reset credentials for affected users",
          "Check for successful credential harvesting",
          "Block sender domain at email gateway",
          "Submit phishing URL to block lists",
          "Send awareness notification to organization",
        ],
      },
      insider_threat: {
        name: "Insider Threat Response",
        severity: "P1",
        steps: [
          "Preserve all audit logs and access records",
          "Restrict access without alerting the subject",
          "Review data access patterns for exfiltration",
          "Engage HR and legal teams",
          "Implement enhanced monitoring",
          "Prepare evidence package for investigation",
        ],
      },
      compromised_credentials: {
        name: "Compromised Credentials Response",
        severity: "P2",
        steps: [
          "Force password reset for affected accounts",
          "Revoke all active sessions and tokens",
          "Enable MFA if not already active",
          "Review access logs for unauthorized activity",
          "Check for privilege escalation attempts",
          "Scan for persistence mechanisms",
          "Notify user of account compromise",
        ],
      },
      supply_chain_remediation: {
        name: "Supply Chain Remediation",
        severity: "P2",
        steps: [
          "Identify malicious dependency and impacted services",
          "Purge package-lock and pin to patched version",
          "Invalidate build caches and artifacts",
          "Rotate CI/CD credentials and tokens",
          "Rebuild and redeploy from clean sources",
          "Audit dependency tree for further anomalies",
          "Document supply chain indicators and IoCs",
        ],
      },
    };

    const pb = playbooks[playbook];
    const entry = logAction("execute_playbook", target, "executed", {
      playbook: pb.name,
      incident_id,
      steps: pb.steps,
      auto_approve,
      recommended_severity: pb.severity,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              action_type: "execute_playbook",
              playbook_name: pb.name,
              playbook_target: target,
              incident_id,
              recommended_severity: pb.severity,
              total_steps: pb.steps.length,
              steps: pb.steps.map((step, i) => ({
                step: i + 1,
                action: step,
                status: auto_approve ? "executed" : "pending_approval",
              })),
              message: auto_approve
                ? `Playbook "${pb.name}" executed with ${pb.steps.length} steps`
                : `Playbook "${pb.name}" prepared with ${pb.steps.length} steps awaiting approval`,
              audit: entry,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get Action Log
server.tool(
  "get_action_log",
  "Retrieve the log of all security actions taken during the current session",
  {
    limit: z
      .number()
      .optional()
      .default(50)
      .describe("Maximum number of entries to return"),
  },
  async ({ limit }) => {
    const entries = actionLog.slice(-limit);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              total_actions: actionLog.length,
              returned: entries.length,
              actions: entries,
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ShieldOps Security Playbook MCP server running");
}

main().catch(console.error);
