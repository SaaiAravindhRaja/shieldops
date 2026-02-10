"use client";

import { useAgents } from "@/lib/use-data";
import { formatCost, formatTimeAgo, cn, AGENT_COLORS } from "@/lib/utils";
import { Clock, DollarSign, Wrench, Activity, Zap, Lock, ShieldCheck } from "lucide-react";

const providerMeta: Record<string, { color: string; bg: string }> = {
  Google: { color: "#34d399", bg: "rgba(52,211,153,0.08)" },
};

export default function AgentsPage() {
  const { data: agents } = useAgents();
  return (
    <div className="space-y-5">
      <div className="animate-in delay-1">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#fafaf9" }}>
          Agent Monitoring
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#5c5c58" }}>
          5 specialized AI agents powered by Archestra
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.map((agent, i) => {
          const statusColor =
            agent.status === "busy" ? "#fbbf24" : agent.status === "online" ? "#34d399" : "#3a3a37";
          const ledClass =
            agent.status === "busy" ? "led-amber" : agent.status === "online" ? "led-green" : "led-off";
          const budgetPct = Math.round((agent.cost_today / agent.cost_limit) * 100);
          const provider = providerMeta[agent.provider] || { color: "#5c5c58", bg: "rgba(255,255,255,0.04)" };
          const agentColor = AGENT_COLORS[agent.id] || "#5c5c58";

          return (
            <div
              key={agent.id}
              className={cn("card-glow p-5 animate-in", `delay-${Math.min(i + 2, 8)}`)}
              style={{ borderLeft: `3px solid ${agentColor}` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg font-mono font-extrabold text-sm"
                    style={{ background: `${agentColor}15`, color: agentColor }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold" style={{ color: "#fafaf9" }}>
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className={`led ${ledClass}`} />
                      <span className="text-[10px] capitalize font-mono" style={{ color: statusColor }}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-1 rounded-md border"
                  style={{
                    color: provider.color,
                    background: provider.bg,
                    borderColor: `${provider.color}22`,
                  }}
                >
                  {agent.model}
                </span>
              </div>

              <p className="text-xs mb-4 leading-relaxed" style={{ color: "#5c5c58" }}>
                {agent.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg p-2.5 text-center" style={{ background: "#19191c" }}>
                  <Activity className="h-3 w-3 mx-auto mb-1" style={{ color: "#3a3a37" }} />
                  <span className="text-lg font-mono font-bold tabular-nums" style={{ color: "#d4d4d0" }}>
                    {agent.incidents_handled}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>
                    Handled
                  </p>
                </div>
                <div className="rounded-lg p-2.5 text-center" style={{ background: "#19191c" }}>
                  <Zap className="h-3 w-3 mx-auto mb-1" style={{ color: "#3a3a37" }} />
                  <span className="text-lg font-mono font-bold tabular-nums" style={{ color: "#d4d4d0" }}>
                    {agent.avg_response_sec}s
                  </span>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>
                    Avg Speed
                  </p>
                </div>
                <div className="rounded-lg p-2.5 text-center" style={{ background: "#19191c" }}>
                  <DollarSign className="h-3 w-3 mx-auto mb-1" style={{ color: "#3a3a37" }} />
                  <span className="text-lg font-mono font-bold tabular-nums" style={{ color: "#d4d4d0" }}>
                    {formatCost(agent.cost_today)}
                  </span>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>
                    Today
                  </p>
                </div>
              </div>

              {/* Budget Gauge */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>
                    Daily Budget
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "#5c5c58" }}>
                    {budgetPct}%
                  </span>
                </div>
                <div className="gauge-track">
                  <div
                    className="gauge-fill"
                    style={{
                      width: `${budgetPct}%`,
                      background: budgetPct > 80 ? "#f87171" : budgetPct > 50 ? "#fbbf24" : "#34d399",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-mono" style={{ color: "#3a3a37" }}>
                    {formatCost(agent.cost_today)}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: "#3a3a37" }}>
                    {formatCost(agent.cost_limit)}
                  </span>
                </div>
              </div>

              {/* Last Action */}
              <div className="rounded-lg p-3 mb-4" style={{ background: "#19191c" }}>
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-3 w-3" style={{ color: "#3a3a37" }} />
                  <span className="text-[10px]" style={{ color: "#3a3a37" }}>
                    {formatTimeAgo(new Date(agent.last_active))}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "#8a8a86" }}>{agent.last_action}</p>
              </div>

              {/* Tools */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Wrench className="h-3 w-3" style={{ color: "#3a3a37" }} />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>
                    Tools ({agent.tools.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "#19191c", color: "#5c5c58" }}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Archestra Tool Policy Matrix */}
      <div className="card-glow p-5 animate-in delay-6">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-4 w-4" style={{ color: "#c084fc" }} />
          <h2 className="text-sm font-bold" style={{ color: "#fafaf9" }}>
            Archestra Tool Policies
          </h2>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(192,132,252,0.1)", color: "#c084fc" }}>
            Least Privilege
          </span>
        </div>
        <p className="text-[11px] mb-4" style={{ color: "#5c5c58" }}>
          Each agent only accesses tools relevant to its phase. Enforced by Archestra Tool Policies.
        </p>
        <ToolPolicyMatrix />
      </div>
    </div>
  );
}

/* ── Tool Policy Matrix ────────────────── */

const POLICY_AGENTS = ["Sentinel", "Sherlock", "Responder", "Chronicler", "Overseer"] as const;
const POLICY_TOOLS = [
  { name: "create_incident", server: "incident-db" },
  { name: "list_incidents", server: "incident-db" },
  { name: "get_incident", server: "incident-db" },
  { name: "update_incident", server: "incident-db" },
  { name: "add_evidence", server: "incident-db" },
  { name: "get_incident_stats", server: "incident-db" },
  { name: "check_ip", server: "threat-intel" },
  { name: "check_hash", server: "threat-intel" },
  { name: "check_domain", server: "threat-intel" },
  { name: "check_cve", server: "threat-intel" },
  { name: "bulk_check_ips", server: "threat-intel" },
  { name: "block_ip", server: "security-playbook" },
  { name: "isolate_pod", server: "security-playbook" },
  { name: "revoke_token", server: "security-playbook" },
  { name: "quarantine_user", server: "security-playbook" },
  { name: "execute_playbook", server: "security-playbook" },
  { name: "get_action_log", server: "security-playbook" },
];

const POLICY_MAP: Record<string, string[]> = {
  Sentinel: ["create_incident", "list_incidents", "get_incident_stats"],
  Sherlock: ["check_ip", "check_hash", "check_domain", "check_cve", "bulk_check_ips", "get_incident", "add_evidence", "update_incident"],
  Responder: ["block_ip", "isolate_pod", "revoke_token", "quarantine_user", "execute_playbook", "get_action_log", "update_incident", "add_evidence"],
  Chronicler: ["get_incident", "update_incident", "add_evidence", "get_incident_stats"],
  Overseer: POLICY_TOOLS.map(t => t.name),
};

const SERVER_COLORS: Record<string, string> = {
  "incident-db": "#34d399",
  "threat-intel": "#fb923c",
  "security-playbook": "#fbbf24",
};

function ToolPolicyMatrix() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr>
            <th className="text-left py-2 pr-3 sticky left-0" style={{ background: "#0a0a0b", color: "#3a3a37" }}>Tool</th>
            {POLICY_AGENTS.map(a => (
              <th key={a} className="px-2 py-2 text-center" style={{ color: AGENT_COLORS[a.toLowerCase()] || "#5c5c58" }}>
                {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {POLICY_TOOLS.map((tool) => (
            <tr key={tool.name} style={{ borderTop: "1px solid #19191c" }}>
              <td className="py-1.5 pr-3 sticky left-0" style={{ background: "#0a0a0b" }}>
                <span style={{ color: SERVER_COLORS[tool.server] }}>{tool.name}</span>
              </td>
              {POLICY_AGENTS.map(a => {
                const allowed = POLICY_MAP[a]?.includes(tool.name);
                return (
                  <td key={a} className="text-center px-2 py-1.5">
                    {allowed ? (
                      <ShieldCheck className="h-3 w-3 mx-auto" style={{ color: "#34d399" }} />
                    ) : (
                      <span style={{ color: "#252529" }}>-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
