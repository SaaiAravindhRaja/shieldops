"use client";

import { agents } from "@/lib/mock-data";
import { formatCost, formatTimeAgo, cn, AGENT_COLORS } from "@/lib/utils";
import { Clock, DollarSign, Wrench, Activity, Zap } from "lucide-react";

const providerMeta: Record<string, { color: string; bg: string }> = {
  OpenAI: { color: "#34d399", bg: "rgba(52,211,153,0.08)" },
  Anthropic: { color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
  Google: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
};

export default function AgentsPage() {
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
    </div>
  );
}
