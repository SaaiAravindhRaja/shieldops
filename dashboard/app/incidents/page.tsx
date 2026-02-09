"use client";

import { useState } from "react";
import Link from "next/link";
import { incidents } from "@/lib/mock-data";
import { severityConfig, statusConfig, formatTimeAgo, formatCost, cn } from "@/lib/utils";
import type { Severity, IncidentStatus } from "@/lib/utils";
import { Search, Bot, ArrowRight, Filter } from "lucide-react";

export default function IncidentsPage() {
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | "all">("all");

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== "all" && inc.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && inc.status !== filterStatus) return false;
    if (search && !inc.title.toLowerCase().includes(search.toLowerCase()) && !inc.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="animate-in delay-1">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#fafaf9" }}>
          Incidents
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#5c5c58" }}>
          {incidents.length} total incidents tracked
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 animate-in delay-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#3a3a37" }} />
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: "#3a3a37" }} />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as Severity | "all")}
          >
            <option value="all">All Severity</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as IncidentStatus | "all")}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="triaging">Triaging</option>
            <option value="investigating">Investigating</option>
            <option value="responding">Responding</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table Header */}
      <div className="animate-in delay-3">
        <div
          className="flex items-center gap-4 px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider"
          style={{ color: "#3a3a37", borderBottom: "1px solid #1a1a1e" }}
        >
          <span className="w-12">SEV</span>
          <span className="flex-1">INCIDENT</span>
          <span className="w-20">AGENT</span>
          <span className="w-24">STATUS</span>
          <span className="w-14 text-right">MTTR</span>
          <span className="w-16 text-right">COST</span>
          <span className="w-16 text-right">TIME</span>
          <span className="w-4" />
        </div>

        {/* Incident Rows */}
        <div
          className="rounded-b-lg overflow-hidden"
          style={{ border: "1px solid #1a1a1e", borderTop: "none" }}
        >
          {filtered.map((incident, i) => {
            const sev = severityConfig[incident.severity];
            const status = statusConfig[incident.status];
            return (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="table-row group"
                style={{
                  borderLeft: `3px solid ${sev.hex}`,
                  background: i % 2 === 0 ? "#111113" : "#0e0e10",
                }}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Severity */}
                  <div className="w-12 shrink-0">
                    <span className="text-xs font-mono font-bold" style={{ color: sev.hex }}>
                      {incident.severity}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono" style={{ color: "#3a3a37" }}>
                        {incident.id}
                      </span>
                      <span className="text-[10px]" style={{ color: "#3a3a37" }}>
                        {incident.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium truncate" style={{ color: "#d4d4d0" }}>
                      {incident.title}
                    </h3>
                  </div>

                  {/* Agent */}
                  <div className="w-20 shrink-0">
                    {incident.assigned_agent ? (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "#5c5c58" }}>
                        <Bot className="h-3 w-3" />
                        {incident.assigned_agent}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: "#3a3a37" }}>—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-24 shrink-0">
                    <span className={cn("badge", status.badge)}>{status.label}</span>
                  </div>

                  {/* MTTR */}
                  <div className="w-14 text-right shrink-0">
                    <span className="text-xs font-mono" style={{ color: "#5c5c58" }}>
                      {incident.mttr_minutes ? `${incident.mttr_minutes}m` : "—"}
                    </span>
                  </div>

                  {/* Cost */}
                  <div className="w-16 text-right shrink-0">
                    <span className="text-xs font-mono" style={{ color: "#5c5c58" }}>
                      {formatCost(incident.cost_total)}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="w-16 text-right shrink-0">
                    <span className="text-[11px] font-mono" style={{ color: "#3a3a37" }}>
                      {formatTimeAgo(new Date(incident.created_at))}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="w-4 shrink-0">
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

        {filtered.length === 0 && (
          <div className="card-glow p-12 text-center">
            <p style={{ color: "#3a3a37" }}>No incidents match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
