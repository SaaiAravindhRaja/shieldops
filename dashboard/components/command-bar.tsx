"use client";

import { getStats, agents, incidents } from "@/lib/mock-data";

const stats = getStats();
const activeAgents = agents.filter((a) => a.status !== "offline").length;
const p1Count = incidents.filter((i) => i.severity === "P1" && !["resolved", "closed"].includes(i.status)).length;

function ThreatLevel() {
  const level = p1Count >= 2 ? "ELEVATED" : p1Count >= 1 ? "GUARDED" : "NOMINAL";
  const color = p1Count >= 2 ? "#f87171" : p1Count >= 1 ? "#fbbf24" : "#34d399";
  const ledClass = p1Count >= 2 ? "led-red" : p1Count >= 1 ? "led-amber" : "led-green";

  return (
    <div className="command-bar-item">
      <div className={`led ${ledClass}`} />
      <span>THREAT:</span>
      <span className="command-bar-value" style={{ color }}>
        {level}
      </span>
    </div>
  );
}

export function CommandBar() {
  return (
    <div className="command-bar">
      <ThreatLevel />

      <div className="command-bar-divider" />

      <div className="command-bar-item">
        <span>INCIDENTS:</span>
        <span className="command-bar-value">{stats.activeCount} active</span>
        <span style={{ color: "#3a3a37" }}>/</span>
        <span>{stats.totalCount} total</span>
      </div>

      <div className="command-bar-divider" />

      <div className="command-bar-item">
        <span>AGENTS:</span>
        <span className="command-bar-value">
          {activeAgents}/{agents.length} online
        </span>
      </div>

      <div className="command-bar-divider" />

      <div className="command-bar-item">
        <span>MTTR:</span>
        <span className="command-bar-value" style={{ color: "#34d399" }}>
          {stats.avgMttr}m
        </span>
      </div>

      <div className="command-bar-divider" />

      <div className="command-bar-item">
        <span>COST:</span>
        <span className="command-bar-value">${stats.totalCost.toFixed(0)}</span>
        <span>this week</span>
      </div>

      <div style={{ flex: 1 }} />

      <div className="command-bar-item">
        <div className="led led-green" />
        <span className="command-bar-value" style={{ color: "#34d399" }}>
          OPERATIONAL
        </span>
      </div>
    </div>
  );
}
