"use client";

import { use } from "react";
import Link from "next/link";
import { incidents } from "@/lib/mock-data";
import { severityConfig, statusConfig, formatTimeAgo, formatCost, cn } from "@/lib/utils";
import {
  ArrowLeft,
  Bot,
  Clock,
  DollarSign,
  FileText,
  Globe,
  Hash,
  Mail,
  Link2,
  Server,
  Terminal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Wrench,
} from "lucide-react";

const agentIcons: Record<string, typeof Bot> = {
  Sentinel: Shield,
  Sherlock: ShieldAlert,
  Responder: ShieldCheck,
  Chronicler: FileText,
  Overseer: ShieldX,
};

const evidenceIcons: Record<string, typeof Globe> = {
  ip: Globe,
  hash: Hash,
  domain: Globe,
  email: Mail,
  url: Link2,
  file: FileText,
  log: Terminal,
  screenshot: FileText,
};

const agentColors: Record<string, { hex: string; muted: string }> = {
  Sentinel: { hex: "#34d399", muted: "rgba(52,211,153,0.1)" },
  Sherlock: { hex: "#fb923c", muted: "rgba(251,146,60,0.1)" },
  Responder: { hex: "#fbbf24", muted: "rgba(251,191,36,0.1)" },
  Chronicler: { hex: "#60a5fa", muted: "rgba(96,165,250,0.1)" },
  Overseer: { hex: "#a78bfa", muted: "rgba(167,139,250,0.1)" },
};

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const incident = incidents.find((i) => i.id === id);

  if (!incident) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: "#fafaf9" }}>Incident Not Found</h2>
          <p className="mb-4" style={{ color: "#3a3a37" }}>No incident with ID {id}</p>
          <Link href="/incidents" style={{ color: "#34d399" }} className="text-sm hover:underline">
            Back to Incidents
          </Link>
        </div>
      </div>
    );
  }

  const sev = severityConfig[incident.severity];
  const status = statusConfig[incident.status];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="animate-in delay-1">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1 text-sm mb-4 transition-colors"
          style={{ color: "#5c5c58" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents
        </Link>

        <div className="card-glow p-6" style={{ borderLeft: `3px solid ${sev.hex}` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-mono font-bold" style={{ color: sev.hex }}>
                  {incident.severity} — {sev.label}
                </span>
                <span className="text-sm font-mono" style={{ color: "#3a3a37" }}>{incident.id}</span>
                <span className={cn("badge", status.badge)}>{status.label}</span>
              </div>
              <h1 className="text-lg font-bold" style={{ color: "#fafaf9" }}>{incident.title}</h1>
              <p className="text-sm leading-relaxed mt-2" style={{ color: "#8a8a86" }}>
                {incident.description}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div
            className="flex flex-wrap items-center gap-6 mt-5 pt-4"
            style={{ borderTop: "1px solid #1a1a1e" }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5c5c58" }}>
              <Server className="h-4 w-4" style={{ color: "#3a3a37" }} />
              Source: <span className="font-mono" style={{ color: "#8a8a86" }}>{incident.source}</span>
            </div>
            {incident.assigned_agent && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#5c5c58" }}>
                <Bot className="h-4 w-4" style={{ color: "#3a3a37" }} />
                Agent: <span style={{ color: "#8a8a86" }}>{incident.assigned_agent}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5c5c58" }}>
              <Clock className="h-4 w-4" style={{ color: "#3a3a37" }} />
              {formatTimeAgo(new Date(incident.created_at))}
            </div>
            {incident.mttr_minutes && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#5c5c58" }}>
                <Clock className="h-4 w-4" style={{ color: "#3a3a37" }} />
                MTTR: <span className="font-mono" style={{ color: "#34d399" }}>{incident.mttr_minutes}m</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5c5c58" }}>
              <DollarSign className="h-4 w-4" style={{ color: "#3a3a37" }} />
              Cost: <span className="font-mono" style={{ color: "#8a8a86" }}>{formatCost(incident.cost_total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Timeline */}
        <div className="xl:col-span-2 animate-in delay-2">
          <h2 className="section-label mb-4">Investigation Timeline</h2>
          <div className="relative">
            <div className="timeline-connector" />

            <div className="space-y-1">
              {incident.timeline.map((event, i) => {
                const AgentIcon = agentIcons[event.agent] || Bot;
                const colors = agentColors[event.agent] || { hex: "#5c5c58", muted: "rgba(255,255,255,0.05)" };
                return (
                  <div key={event.id} className={cn("relative pl-12 py-2.5 animate-in", `delay-${Math.min(i + 3, 8)}`)}>
                    <div
                      className="absolute left-2 top-3 h-7 w-7 rounded-full border flex items-center justify-center"
                      style={{ borderColor: colors.muted, background: colors.muted }}
                    >
                      <AgentIcon className="h-3.5 w-3.5" style={{ color: colors.hex }} />
                    </div>

                    <div className="card-glow p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: colors.hex }}>
                            {event.agent}
                          </span>
                          <span className="text-sm font-medium" style={{ color: "#d4d4d0" }}>
                            {event.action}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono" style={{ color: "#3a3a37" }}>
                          {formatTimeAgo(new Date(event.timestamp))}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#5c5c58" }}>{event.details}</p>
                      {event.tool_used && (
                        <div className="flex items-center gap-1 mt-2">
                          <Wrench className="h-3 w-3" style={{ color: "#3a3a37" }} />
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: "#19191c", color: "#5c5c58" }}
                          >
                            {event.tool_used}()
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="animate-in delay-3">
          <h2 className="section-label mb-4">Evidence ({incident.evidence.length})</h2>

          {incident.evidence.length > 0 ? (
            <div className="space-y-1.5">
              {incident.evidence.map((ev) => {
                const EvidenceIcon = evidenceIcons[ev.type] || FileText;
                return (
                  <div key={ev.id} className="card-glow p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "#19191c" }}
                      >
                        <EvidenceIcon className="h-4 w-4" style={{ color: "#5c5c58" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] uppercase font-mono tracking-wider"
                            style={{ color: "#3a3a37" }}
                          >
                            {ev.type}
                          </span>
                          <span className="text-[10px]" style={{ color: "#3a3a37" }}>
                            via {ev.source}
                          </span>
                        </div>
                        <p className="text-sm font-mono break-all" style={{ color: "#d4d4d0" }}>
                          {ev.value}
                        </p>
                        {ev.threat_score !== null && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px]" style={{ color: "#3a3a37" }}>Threat</span>
                            <div className="threat-bar flex-1 max-w-[100px]">
                              <div
                                className="threat-fill"
                                style={{
                                  width: `${ev.threat_score}%`,
                                  background:
                                    ev.threat_score > 80 ? "#f87171" : ev.threat_score > 50 ? "#fbbf24" : "#34d399",
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-mono font-semibold"
                              style={{
                                color:
                                  ev.threat_score > 80 ? "#f87171" : ev.threat_score > 50 ? "#fbbf24" : "#34d399",
                              }}
                            >
                              {ev.threat_score}/100
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-glow p-8 text-center">
              <p style={{ color: "#3a3a37" }}>No evidence collected yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
