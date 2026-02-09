"use client";

import { incidents, agents, getStats } from "@/lib/mock-data";
import { severityConfig, statusConfig, formatTimeAgo, formatCost, cn } from "@/lib/utils";
import type { Severity } from "@/lib/utils";
import {
  Shield,
  Clock,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  Bot,
  Zap,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

const stats = getStats();

/* ── Stat Card ──────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
  delay,
  children,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  trend?: { value: string; positive: boolean };
  delay: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("card-glow p-5 animate-in", `delay-${delay}`)}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: `${accent}15` }}
          >
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
          <span className="section-label">{label}</span>
        </div>
        {trend && (
          <span
            className="flex items-center gap-1 text-xs font-mono font-semibold"
            style={{ color: trend.positive ? "#34d399" : "#f87171" }}
          >
            <TrendingDown className="h-3 w-3" />
            {trend.value}
          </span>
        )}
      </div>
      <div
        className="font-mono text-3xl font-extrabold tracking-tight tabular-nums"
        style={{ color: "#fafaf9" }}
      >
        {value}
      </div>
      <p className="mt-1 text-xs" style={{ color: "#5c5c58" }}>{sub}</p>
      {children}
    </div>
  );
}

/* ── Severity Bar ───────────────────────────────── */
function SeverityBar({ bySeverity }: { bySeverity: Record<Severity, number> }) {
  const total = Object.values(bySeverity).reduce((a, b) => a + b, 0) || 1;
  const colors = { P1: "#f87171", P2: "#fb923c", P3: "#fbbf24", P4: "#34d399" };
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex gap-0.5 h-2 rounded overflow-hidden" style={{ background: "#212124" }}>
        {(["P1", "P2", "P3", "P4"] as Severity[]).map((s) => (
          <div
            key={s}
            className="rounded gauge-fill"
            style={{
              width: `${(bySeverity[s] / total) * 100}%`,
              background: colors[s],
            }}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {(["P1", "P2", "P3", "P4"] as Severity[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: colors[s] }} />
            <span className="text-[10px] font-mono" style={{ color: "#5c5c58" }}>
              {s}: {bySeverity[s]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Incident Feed ──────────────────────────────── */
function IncidentFeed() {
  const activeIncidents = incidents
    .filter((i) => !["resolved", "closed"].includes(i.status))
    .sort((a, b) => {
      const sev = { P1: 0, P2: 1, P3: 2, P4: 3 };
      return sev[a.severity] - sev[b.severity];
    });

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #1a1a1e" }}>
      {activeIncidents.map((incident, i) => {
        const sev = severityConfig[incident.severity];
        const status = statusConfig[incident.status];
        return (
          <Link
            key={incident.id}
            href={`/incidents/${incident.id}`}
            className={cn("table-row group animate-in", `delay-${Math.min(i + 3, 8)}`)}
            style={{
              borderLeft: `3px solid ${sev.hex}`,
              background: i % 2 === 0 ? "#111113" : "#0e0e10",
            }}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Severity */}
              <div className="flex flex-col items-center w-10 shrink-0">
                <span className="text-xs font-mono font-bold" style={{ color: sev.hex }}>
                  {incident.severity}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-mono" style={{ color: "#3a3a37" }}>
                    {incident.id}
                  </span>
                  <span className="text-[10px]" style={{ color: "#3a3a37" }}>
                    {incident.type.replace(/_/g, " ")}
                  </span>
                </div>
                <h3
                  className="text-sm font-medium truncate"
                  style={{ color: "#d4d4d0" }}
                >
                  {incident.title}
                </h3>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 shrink-0">
                {incident.assigned_agent && (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "#5c5c58" }}>
                    <Bot className="h-3 w-3" />
                    {incident.assigned_agent}
                  </span>
                )}
                <span className={cn("badge", status.badge)}>{status.label}</span>
                <span className="text-[11px] font-mono" style={{ color: "#3a3a37" }}>
                  {formatTimeAgo(new Date(incident.created_at))}
                </span>
                <ArrowRight
                  className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "#5c5c58" }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Agent Strip ────────────────────────────────── */
function AgentStrip() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {agents.map((agent, i) => {
        const statusColor =
          agent.status === "busy" ? "#fbbf24" : agent.status === "online" ? "#34d399" : "#3a3a37";
        const budgetPct = Math.round((agent.cost_today / agent.cost_limit) * 100);
        const ledClass =
          agent.status === "busy" ? "led-amber" : agent.status === "online" ? "led-green" : "led-off";

        return (
          <Link
            key={agent.id}
            href="/agents"
            className={cn("card-glow p-3 animate-in group", `delay-${Math.min(i + 5, 8)}`)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`led ${ledClass}`} />
              <span className="text-xs font-semibold" style={{ color: "#d4d4d0" }}>
                {agent.name}
              </span>
            </div>
            <div
              className="text-[10px] font-mono mb-2 truncate"
              style={{ color: "#5c5c58" }}
            >
              {agent.model}
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
                {budgetPct}%
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────── */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between animate-in delay-1">
        <div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "#fafaf9" }}
          >
            Security Operations Center
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5c5c58" }}>
            Multi-agent AI SOC powered by Archestra MCP Platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="led led-green" />
          <span
            className="text-xs font-mono font-semibold"
            style={{ color: "#34d399" }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Active Incidents"
          value={stats.activeCount}
          sub={`${stats.totalCount} total this week`}
          icon={AlertTriangle}
          accent="#f87171"
          delay={1}
        >
          <SeverityBar bySeverity={stats.bySeverity} />
        </StatCard>
        <StatCard
          label="Avg MTTR"
          value={`${stats.avgMttr}m`}
          sub="Mean time to resolution"
          icon={Clock}
          accent="#34d399"
          trend={{ value: "18%", positive: true }}
          delay={2}
        />
        <StatCard
          label="Threats Blocked"
          value={stats.threatsBlocked}
          sub="IPs, domains, tokens revoked"
          icon={ShieldCheck}
          accent="#60a5fa"
          delay={3}
        />
        <StatCard
          label="Cost Saved"
          value={formatCost(stats.costSaved)}
          sub="vs. single-model approach"
          icon={DollarSign}
          accent="#34d399"
          trend={{ value: "96%", positive: true }}
          delay={4}
        >
          <div className="mt-2.5">
            <span
              className="badge badge-low"
              style={{ fontSize: 10 }}
            >
              <Zap className="h-3 w-3" /> Dynamic Model Switching
            </span>
          </div>
        </StatCard>
      </div>

      {/* Incident Feed */}
      <div className="animate-in delay-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-label">Active Incident Feed</h2>
          <Link
            href="/incidents"
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: "#5c5c58" }}
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <IncidentFeed />
      </div>

      {/* Agent Status Strip */}
      <div className="animate-in delay-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-label">Agent Status</h2>
          <Link
            href="/agents"
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: "#5c5c58" }}
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <AgentStrip />
      </div>
    </div>
  );
}
