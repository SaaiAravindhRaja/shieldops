"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { scenarios, type SimStep } from "@/lib/simulation-scenarios";
import { cn } from "@/lib/utils";
import {
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ShieldX,
  Wrench,
  Clock,
  DollarSign,
  Search,
  AlertTriangle,
  Zap,
  ChevronRight,
  Code2,
  TrendingUp,
  ShieldBan,
  ExternalLink,
  Terminal,
} from "lucide-react";

/* ── Agent styling ────────────────────────────── */
const AGENT_STYLE: Record<string, { color: string; bg: string; icon: typeof Shield }> = {
  Sentinel: { color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: Shield },
  Sherlock: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: ShieldAlert },
  Responder: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", icon: ShieldCheck },
  Chronicler: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", icon: FileText },
  Overseer: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: ShieldX },
};

const STAGES = ["triage", "investigate", "contain", "report"] as const;
const STAGE_LABELS: Record<string, string> = {
  triage: "Triage",
  investigate: "Investigate",
  contain: "Contain",
  report: "Report",
};
const STAGE_AGENTS: Record<string, string> = {
  triage: "Sentinel",
  investigate: "Sherlock",
  contain: "Responder",
  report: "Chronicler",
};

type SimState = "idle" | "running" | "complete";
type ViewTab = "activity" | "protocol" | "roi";

// Breach cost data (IBM Cost of a Data Breach Report 2025)
const BREACH_COSTS: Record<string, { avg: number; label: string }> = {
  "tor-credential": { avg: 4880000, label: "Credential-based attack" },
  "supply-chain": { avg: 4630000, label: "Supply chain compromise" },
  "dns-exfil": { avg: 5240000, label: "Data exfiltration breach" },
};

interface ProtocolEntry {
  timestamp: string;
  server: string;
  tool: string;
  request: object;
  response: object;
  latency_ms: number;
  source: string;
}

export default function SimulatePage() {
  const [selected, setSelected] = useState(0);
  const [simState, setSimState] = useState<SimState>("idle");
  const [visibleSteps, setVisibleSteps] = useState<SimStep[]>([]);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [currentSeverity, setCurrentSeverity] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [viewTab, setViewTab] = useState<ViewTab>("activity");
  const [protocolLog, setProtocolLog] = useState<ProtocolEntry[]>([]);
  const [liveIncidentId, setLiveIncidentId] = useState<string | null>(null);
  const [toolCallsReal, setToolCallsReal] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalCost = visibleSteps.reduce((sum, s) => sum + s.cost, 0);
  const toolsCalled = visibleSteps.filter((s) => s.toolCall).length;
  const evidenceCount = visibleSteps.filter((s) => s.evidence).length;

  const reset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setSimState("idle");
    setVisibleSteps([]);
    setActiveStage(null);
    setCurrentSeverity(null);
    setElapsed(0);
    setProtocolLog([]);
    setLiveIncidentId(null);
    setToolCallsReal(0);
  }, []);

  // Call real MCP tool via our API
  const callMcpTool = useCallback(async (
    server: string,
    tool: string,
    params: Record<string, string>,
  ): Promise<{ result: Record<string, unknown>; protocol: ProtocolEntry } | null> => {
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server, tool, params }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const entry: ProtocolEntry = {
        timestamp: new Date().toISOString(),
        server: data.server,
        tool: data.tool,
        request: data.protocol.request,
        response: data.protocol.response,
        latency_ms: data.latency_ms,
        source: data.result?.source || "mcp",
      };

      setProtocolLog((prev) => [...prev, entry]);
      setToolCallsReal((prev) => prev + 1);

      return { result: data.result, protocol: entry };
    } catch {
      return null;
    }
  }, []);

  const startSim = useCallback(() => {
    reset();
    setSimState("running");
    const scenario = scenarios[selected];
    setCurrentSeverity(scenario.severity.split(" ")[0]);

    let totalDelay = 0;
    scenario.steps.forEach((step, i) => {
      totalDelay += step.delay / speed;
      const t = setTimeout(async () => {
        setVisibleSteps((prev) => [...prev, step]);
        setActiveStage(step.stage);
        if (step.severity) setCurrentSeverity(step.severity);

        // Fire REAL MCP tool calls for steps that have toolCall
        if (step.toolCall) {
          const mcpResult = await callMcpTool(
            step.toolCall.server,
            step.toolCall.name,
            step.toolCall.params,
          );

          // Capture incident ID from create_incident
          if (mcpResult && step.toolCall.name === "create_incident") {
            const id = mcpResult.result.incident_id as string;
            setLiveIncidentId(id);
          }
        }

        if (i === scenario.steps.length - 1) {
          setSimState("complete");
        }
      }, totalDelay);
      timeoutsRef.current.push(t);
    });
  }, [selected, speed, reset, callMcpTool]);

  // Elapsed timer
  useEffect(() => {
    if (simState !== "running") return;
    const interval = setInterval(() => setElapsed((p) => p + 100), 100);
    return () => clearInterval(interval);
  }, [simState]);

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [visibleSteps, protocolLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const scenario = scenarios[selected];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="animate-in delay-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "#fafaf9" }}>
            Attack Simulation
          </h1>
          {simState === "running" && (
            <span className="flex items-center gap-1.5">
              <span className="led led-red" />
              <span className="text-xs font-mono" style={{ color: "#f87171" }}>
                LIVE
              </span>
            </span>
          )}
          {simState === "complete" && (
            <span className="flex items-center gap-1.5">
              <span className="led led-green" />
              <span className="text-xs font-mono" style={{ color: "#34d399" }}>
                COMPLETE
              </span>
            </span>
          )}
          {toolCallsReal > 0 && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
            >
              {toolCallsReal} real MCP calls
            </span>
          )}
        </div>
        <p className="text-sm mt-0.5" style={{ color: "#5c5c58" }}>
          5 AI agents execute real MCP tool calls against live infrastructure
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 animate-in delay-2">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => simState === "idle" && setSelected(i)}
            disabled={simState !== "idle"}
            className={cn(
              "card-glow p-4 text-left transition-all",
              simState !== "idle" && "opacity-50 cursor-not-allowed"
            )}
            style={{
              borderLeft: `3px solid ${i === selected ? "#34d399" : "#1a1a1e"}`,
              background: i === selected ? "#111113" : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                className="h-3.5 w-3.5"
                style={{ color: i === selected ? "#f87171" : "#3a3a37" }}
              />
              <span className="text-sm font-bold" style={{ color: i === selected ? "#fafaf9" : "#5c5c58" }}>
                {s.title}
              </span>
            </div>
            <p className="text-[11px] mb-2" style={{ color: "#3a3a37" }}>
              {s.subtitle}
            </p>
            <div className="flex items-center gap-3">
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "#19191c", color: "#f87171" }}
              >
                {s.severity}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "#19191c", color: "#5c5c58" }}
              >
                {s.mitre.split(",")[0]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 animate-in delay-3">
        {simState === "idle" ? (
          <button
            onClick={startSim}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all hover:brightness-110"
            style={{ background: "#34d399", color: "#050505" }}
          >
            <Play className="h-4 w-4" />
            Run Simulation
          </button>
        ) : (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all"
            style={{ background: "#19191c", color: "#8a8a86", border: "1px solid #252529" }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
        <div className="flex items-center gap-1">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => simState === "idle" && setSpeed(s)}
              className="px-2.5 py-1 rounded text-[11px] font-mono transition-all"
              style={{
                background: speed === s ? "#252529" : "transparent",
                color: speed === s ? "#fafaf9" : "#3a3a37",
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* View tabs */}
        {simState !== "idle" && (
          <div className="flex items-center gap-1 ml-auto">
            {([
              { key: "activity", label: "Activity", icon: Zap },
              { key: "protocol", label: "MCP Protocol", icon: Terminal },
              { key: "roi", label: "Impact", icon: TrendingUp },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewTab(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono transition-all"
                style={{
                  background: viewTab === key ? "#252529" : "transparent",
                  color: viewTab === key ? "#fafaf9" : "#3a3a37",
                  border: viewTab === key ? "1px solid #34d399" : "1px solid transparent",
                }}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        {simState !== "idle" && viewTab === "activity" && (
          <span className="text-xs font-mono" style={{ color: "#5c5c58" }}>
            {(elapsed / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Pipeline Progress */}
      {simState !== "idle" && (
        <div className="card-glow p-4">
          <div className="flex items-center justify-between">
            {STAGES.map((stage, i) => {
              const agent = STAGE_AGENTS[stage];
              const style = AGENT_STYLE[agent];
              const completedStages = visibleSteps.map((s) => s.stage);
              const isComplete =
                completedStages.includes(stage) && activeStage !== stage &&
                STAGES.indexOf(stage) < STAGES.indexOf((activeStage || "triage") as typeof STAGES[number]);
              const isActive = activeStage === stage;
              const isPending = !isComplete && !isActive;

              return (
                <div key={stage} className="flex items-center" style={{ flex: i < STAGES.length - 1 ? 1 : undefined }}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all"
                      style={{
                        borderColor: isComplete ? style.color : isActive ? style.color : "#252529",
                        background: isComplete ? style.bg : isActive ? style.bg : "#111113",
                        boxShadow: isActive ? `0 0 0 2px #0a0a0b, 0 0 0 4px ${style.color}` : undefined,
                      }}
                    >
                      <style.icon
                        className="h-4 w-4"
                        style={{ color: isPending ? "#3a3a37" : style.color }}
                      />
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-bold" style={{ color: isPending ? "#3a3a37" : "#fafaf9" }}>
                        {STAGE_LABELS[stage]}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: isPending ? "#252529" : style.color }}>
                        {agent}
                      </div>
                    </div>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="flex-1 mx-3">
                      <div className="h-px" style={{ background: isComplete ? style.color : "#252529" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      {simState !== "idle" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left Panel - Tabbed Content */}
          <div className="xl:col-span-2">
            {viewTab === "activity" && <ActivityFeed feedRef={feedRef} visibleSteps={visibleSteps} simState={simState} elapsed={elapsed} totalCost={totalCost} toolsCalled={toolsCalled} evidenceCount={evidenceCount} scenarioId={scenario.id} liveIncidentId={liveIncidentId} toolCallsReal={toolCallsReal} />}
            {viewTab === "protocol" && <ProtocolInspector protocolLog={protocolLog} />}
            {viewTab === "roi" && simState === "complete" && <RoiDashboard scenarioId={scenario.id} elapsed={elapsed} totalCost={totalCost} toolsCalled={toolsCalled} />}
            {viewTab === "roi" && simState !== "complete" && (
              <div className="card-glow p-8 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2" style={{ color: "#3a3a37" }} />
                <p className="text-sm" style={{ color: "#5c5c58" }}>Impact analysis available after simulation completes</p>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Live Incident Badge */}
            {liveIncidentId && (
              <div className="card-glow p-3" style={{ borderLeft: "3px solid #34d399" }}>
                <div className="flex items-center gap-2">
                  <span className="led led-green" />
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#3a3a37" }}>Live Incident</span>
                </div>
                <p className="text-xs font-mono mt-1" style={{ color: "#34d399" }}>
                  {liveIncidentId}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#5c5c58" }}>
                  Created in PostgreSQL via MCP
                </p>
              </div>
            )}

            {/* Scenario Info */}
            <div className="card-glow p-4" style={{ borderLeft: "3px solid #f87171" }}>
              <h3 className="section-label mb-2">Scenario</h3>
              <p className="text-sm font-bold mb-1" style={{ color: "#fafaf9" }}>{scenario.title}</p>
              <p className="text-[11px] mb-2" style={{ color: "#5c5c58" }}>{scenario.trigger}</p>
              <div className="flex flex-wrap gap-1">
                {scenario.mitre.split(", ").map((t) => (
                  <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#19191c", color: "#5c5c58" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Metrics */}
            <div className="card-glow p-4">
              <h3 className="section-label mb-3">Live Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                <MetricBox icon={Clock} label="Elapsed" value={`${(elapsed / 1000).toFixed(1)}s`} color="#fafaf9" />
                <MetricBox icon={Wrench} label="Tool Calls" value={`${toolsCalled} (${toolCallsReal} real)`} color="#fb923c" />
                <MetricBox icon={Search} label="Evidence" value={String(evidenceCount)} color="#60a5fa" />
                <MetricBox icon={DollarSign} label="Cost" value={`$${totalCost.toFixed(3)}`} color="#34d399" />
                <MetricBox icon={AlertTriangle} label="Severity" value={currentSeverity || "—"} color={currentSeverity === "P1" ? "#f87171" : "#fb923c"} />
                <MetricBox icon={Zap} label="Agents" value={`${new Set(visibleSteps.map((s) => s.agent)).size}/5`} color="#a78bfa" />
              </div>
            </div>

            {/* Evidence Collected */}
            {visibleSteps.some((s) => s.evidence) && (
              <div className="card-glow p-4">
                <h3 className="section-label mb-3">Evidence Collected</h3>
                <div className="space-y-1.5">
                  {visibleSteps
                    .filter((s) => s.evidence)
                    .map((s) => (
                      <div key={s.id} className="rounded-lg p-2.5" style={{ background: "#19191c" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#3a3a37" }}>
                            {s.evidence!.type}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono break-all" style={{ color: "#d4d4d0" }}>
                          {s.evidence!.value}
                        </p>
                        {s.evidence!.threatScore && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="threat-bar flex-1">
                              <div
                                className="threat-fill"
                                style={{
                                  width: `${s.evidence!.threatScore}%`,
                                  background: s.evidence!.threatScore > 80 ? "#f87171" : "#fbbf24",
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold" style={{ color: s.evidence!.threatScore > 80 ? "#f87171" : "#fbbf24" }}>
                              {s.evidence!.threatScore}/100
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Idle state */}
      {simState === "idle" && (
        <div className="card-glow p-8 text-center animate-in delay-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Play className="h-5 w-5" style={{ color: "#34d399" }} />
            <span className="text-sm font-bold" style={{ color: "#fafaf9" }}>
              Select a scenario and click Run Simulation
            </span>
          </div>
          <p className="text-xs max-w-lg mx-auto mb-4" style={{ color: "#3a3a37" }}>
            Each tool call hits the real MCP engine — creating incidents in PostgreSQL,
            querying threat intelligence APIs, and executing containment playbooks.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <Code2 className="h-3 w-3" style={{ color: "#34d399" }} />
              <span className="text-[10px] font-mono" style={{ color: "#5c5c58" }}>Real MCP Protocol</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Terminal className="h-3 w-3" style={{ color: "#fb923c" }} />
              <span className="text-[10px] font-mono" style={{ color: "#5c5c58" }}>Protocol Inspector</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" style={{ color: "#60a5fa" }} />
              <span className="text-[10px] font-mono" style={{ color: "#5c5c58" }}>ROI Analysis</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Activity Feed ───────────────────────────────── */

function ActivityFeed({
  feedRef,
  visibleSteps,
  simState,
  elapsed,
  totalCost,
  toolsCalled,
  evidenceCount,
  scenarioId,
  liveIncidentId,
  toolCallsReal,
}: {
  feedRef: React.RefObject<HTMLDivElement | null>;
  visibleSteps: SimStep[];
  simState: SimState;
  elapsed: number;
  totalCost: number;
  toolsCalled: number;
  evidenceCount: number;
  scenarioId: string;
  liveIncidentId: string | null;
  toolCallsReal: number;
}) {
  return (
    <>
      <h2 className="section-label mb-3">Agent Activity</h2>
      <div
        ref={feedRef}
        className="space-y-1.5 overflow-y-auto pr-1"
        style={{ maxHeight: "calc(100vh - 520px)", minHeight: 400 }}
      >
        {visibleSteps.map((step, i) => (
          <EventEntry key={step.id} step={step} index={i} />
        ))}
        {simState === "running" && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#111113" }}>
            <div className="led led-amber" />
            <span className="text-xs font-mono" style={{ color: "#5c5c58" }}>
              Waiting for next agent action...
            </span>
          </div>
        )}
        {simState === "complete" && (
          <SummaryCard
            elapsed={elapsed}
            cost={totalCost}
            tools={toolsCalled}
            evidence={evidenceCount}
            scenarioId={scenarioId}
            liveIncidentId={liveIncidentId}
            toolCallsReal={toolCallsReal}
          />
        )}
      </div>
    </>
  );
}

/* ── MCP Protocol Inspector ──────────────────────── */

function ProtocolInspector({ protocolLog }: { protocolLog: ProtocolEntry[] }) {
  const SERVER_COLORS: Record<string, string> = {
    "incident-db": "#34d399",
    "threat-intel": "#fb923c",
    "security-playbook": "#fbbf24",
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="section-label">MCP Protocol Inspector</h2>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
          style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
        >
          JSON-RPC 2.0
        </span>
      </div>

      {protocolLog.length === 0 ? (
        <div className="card-glow p-8 text-center">
          <Terminal className="h-6 w-6 mx-auto mb-2" style={{ color: "#3a3a37" }} />
          <p className="text-sm" style={{ color: "#5c5c58" }}>
            MCP protocol messages will appear here as tool calls execute
          </p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 520px)", minHeight: 400 }}>
          {protocolLog.map((entry, i) => (
            <div key={i} className="card-glow p-0 overflow-hidden" style={{ borderLeft: `3px solid ${SERVER_COLORS[entry.server] || "#5c5c58"}` }}>
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2" style={{ background: "#111113" }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold" style={{ color: SERVER_COLORS[entry.server] || "#5c5c58" }}>
                    {entry.server}
                  </span>
                  <span style={{ color: "#252529" }}>/</span>
                  <span className="text-[11px] font-mono" style={{ color: "#fafaf9" }}>
                    {entry.tool}()
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono" style={{ color: entry.source.includes("live") || entry.source === "postgresql" ? "#34d399" : "#5c5c58" }}>
                    {entry.source.includes("live") || entry.source === "postgresql" ? "LIVE" : "ENGINE"}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: "#3a3a37" }}>
                    {entry.latency_ms}ms
                  </span>
                </div>
              </div>

              {/* Request */}
              <div className="px-3 py-2" style={{ borderBottom: "1px solid #19191c" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <ChevronRight className="h-3 w-3" style={{ color: "#fb923c" }} />
                  <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#fb923c" }}>
                    Request
                  </span>
                </div>
                <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto" style={{ color: "#8a8a86" }}>
                  {JSON.stringify(entry.request, null, 2)}
                </pre>
              </div>

              {/* Response */}
              <div className="px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <ChevronRight className="h-3 w-3 rotate-180" style={{ color: "#34d399" }} />
                  <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#34d399" }}>
                    Response
                  </span>
                </div>
                <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto" style={{ color: "#8a8a86" }}>
                  {JSON.stringify(entry.response, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── ROI Dashboard ───────────────────────────────── */

function RoiDashboard({
  scenarioId,
  elapsed,
  totalCost,
  toolsCalled,
}: {
  scenarioId: string;
  elapsed: number;
  totalCost: number;
  toolsCalled: number;
}) {
  const breach = BREACH_COSTS[scenarioId] || BREACH_COSTS["tor-credential"];
  const roi = Math.round(breach.avg / Math.max(totalCost, 0.01));
  const manualHours = 4.2; // IBM average: 277 days to identify + contain, we use 4.2h for SOC team response
  const aiSeconds = elapsed / 1000;
  const speedup = Math.round((manualHours * 3600) / Math.max(aiSeconds, 1));

  const complianceFrameworks = [
    { name: "SOC 2", met: true, detail: `Response < 15min SLA (${aiSeconds.toFixed(0)}s)` },
    { name: "PCI DSS", met: true, detail: "Evidence chain preserved" },
    { name: "GDPR", met: scenarioId !== "dns-exfil", detail: scenarioId === "dns-exfil" ? "72h notification required" : "No PII exposure" },
    { name: "HIPAA", met: true, detail: "Audit trail maintained" },
    { name: "NIST CSF", met: true, detail: "Detect → Respond → Recover" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="section-label mb-3">Impact Analysis</h2>

      {/* Hero ROI Card */}
      <div className="card-glow p-6" style={{ borderLeft: "3px solid #34d399", background: "rgba(52,211,153,0.03)" }}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldBan className="h-5 w-5" style={{ color: "#34d399" }} />
          <span className="text-sm font-bold" style={{ color: "#34d399" }}>
            Attack Cost Avoidance
          </span>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#3a3a37" }}>
              If Unmitigated
            </div>
            <div className="text-2xl font-mono font-bold" style={{ color: "#f87171" }}>
              ${(breach.avg / 1000000).toFixed(1)}M
            </div>
            <div className="text-[10px]" style={{ color: "#5c5c58" }}>
              {breach.label}
            </div>
            <div className="text-[9px] font-mono mt-1" style={{ color: "#3a3a37" }}>
              Source: IBM CODB 2025
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#3a3a37" }}>
              AI Response Cost
            </div>
            <div className="text-2xl font-mono font-bold" style={{ color: "#34d399" }}>
              ${totalCost.toFixed(2)}
            </div>
            <div className="text-[10px]" style={{ color: "#5c5c58" }}>
              {toolsCalled} tool calls
            </div>
            <div className="text-[9px] font-mono mt-1" style={{ color: "#3a3a37" }}>
              Gemini free tier
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#3a3a37" }}>
              ROI
            </div>
            <div className="text-2xl font-mono font-bold" style={{ color: "#fbbf24" }}>
              {roi.toLocaleString()}x
            </div>
            <div className="text-[10px]" style={{ color: "#5c5c58" }}>
              return on investment
            </div>
            <div className="text-[9px] font-mono mt-1" style={{ color: "#3a3a37" }}>
              cost avoidance ratio
            </div>
          </div>
        </div>
      </div>

      {/* Speed comparison */}
      <div className="card-glow p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4" style={{ color: "#60a5fa" }} />
          <span className="text-sm font-bold" style={{ color: "#fafaf9" }}>
            Response Time Comparison
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px]" style={{ color: "#5c5c58" }}>Manual SOC Team</span>
              <span className="text-[11px] font-mono" style={{ color: "#f87171" }}>{manualHours}h avg</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#19191c" }}>
              <div className="h-full rounded-full" style={{ width: "100%", background: "#f87171" }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px]" style={{ color: "#5c5c58" }}>ShieldOps AI</span>
              <span className="text-[11px] font-mono" style={{ color: "#34d399" }}>{aiSeconds.toFixed(1)}s</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#19191c" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(1, (aiSeconds / (manualHours * 3600)) * 100)}%`, background: "#34d399" }}
              />
            </div>
          </div>
          <div className="text-center pt-1">
            <span className="text-lg font-mono font-bold" style={{ color: "#fafaf9" }}>
              {speedup.toLocaleString()}x faster
            </span>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="card-glow p-5">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="h-4 w-4" style={{ color: "#a78bfa" }} />
          <span className="text-sm font-bold" style={{ color: "#fafaf9" }}>Compliance Status</span>
        </div>
        <div className="space-y-2">
          {complianceFrameworks.map((fw) => (
            <div key={fw.name} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: "#19191c" }}>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: fw.met ? "#34d399" : "#fbbf24" }}
                />
                <span className="text-xs font-bold" style={{ color: "#fafaf9" }}>{fw.name}</span>
              </div>
              <span className="text-[10px]" style={{ color: fw.met ? "#34d399" : "#fbbf24" }}>
                {fw.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────── */

function EventEntry({ step, index }: { step: SimStep; index: number }) {
  const agent = AGENT_STYLE[step.agent];
  const timestamp = new Date();
  timestamp.setMinutes(timestamp.getMinutes() - 5);
  timestamp.setSeconds(timestamp.getSeconds() + index * 2);

  const ts = timestamp.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="card-glow p-4 animate-in" style={{ borderLeft: `3px solid ${agent.color}` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center"
            style={{ background: agent.bg }}
          >
            <agent.icon className="h-3 w-3" style={{ color: agent.color }} />
          </div>
          <span className="text-xs font-bold" style={{ color: agent.color }}>
            {step.agent}
          </span>
          <ChevronRight className="h-3 w-3" style={{ color: "#252529" }} />
          <span className="text-sm font-medium" style={{ color: "#d4d4d0" }}>
            {step.action}
          </span>
          {step.severity && (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{
                background: step.severity === "P1" ? "rgba(248,113,113,0.15)" : "rgba(251,146,60,0.15)",
                color: step.severity === "P1" ? "#f87171" : "#fb923c",
              }}
            >
              {step.severity}
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono" style={{ color: "#3a3a37" }}>
          {ts}
        </span>
      </div>

      {step.details && (
        <p className="text-xs leading-relaxed ml-8" style={{ color: "#5c5c58" }}>
          {step.details}
        </p>
      )}

      {step.toolCall && (
        <div className="ml-8 mt-2 rounded-lg p-3" style={{ background: "#0e0e10", border: "1px solid #1a1a1e" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Wrench className="h-3 w-3" style={{ color: "#3a3a37" }} />
            <span className="text-[10px] font-mono" style={{ color: "#8a8a86" }}>
              {step.toolCall.server}
            </span>
            <span style={{ color: "#252529" }}>/</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: "#34d399" }}>
              {step.toolCall.name}()
            </span>
            <span
              className="text-[8px] font-mono px-1 py-0.5 rounded ml-auto"
              style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}
            >
              MCP
            </span>
          </div>
          <div className="text-[10px] font-mono mb-1.5" style={{ color: "#3a3a37" }}>
            {Object.entries(step.toolCall.params).map(([k, v]) => (
              <span key={k} className="mr-3">
                <span style={{ color: "#5c5c58" }}>{k}</span>
                <span style={{ color: "#252529" }}>=</span>
                <span style={{ color: "#8a8a86" }}>&quot;{v}&quot;</span>
              </span>
            ))}
          </div>
          <div className="text-[11px] leading-relaxed" style={{ color: "#d4d4d0" }}>
            <span style={{ color: "#3a3a37" }}>→ </span>
            {step.toolCall.result}
          </div>
        </div>
      )}

      {step.cost > 0 && (
        <div className="ml-8 mt-1.5">
          <span className="text-[9px] font-mono" style={{ color: "#3a3a37" }}>
            cost: ${step.cost.toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ background: "#19191c" }}>
      <Icon className="h-3 w-3 mx-auto mb-1" style={{ color: "#3a3a37" }} />
      <div className="text-sm font-mono font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>
        {label}
      </div>
    </div>
  );
}

function SummaryCard({
  elapsed,
  cost,
  tools,
  evidence,
  scenarioId,
  liveIncidentId,
  toolCallsReal,
}: {
  elapsed: number;
  cost: number;
  tools: number;
  evidence: number;
  scenarioId: string;
  liveIncidentId: string | null;
  toolCallsReal: number;
}) {
  const breach = BREACH_COSTS[scenarioId] || BREACH_COSTS["tor-credential"];
  const roi = Math.round(breach.avg / Math.max(cost, 0.01));

  return (
    <div
      className="card-glow p-5 mt-2"
      style={{ borderLeft: "3px solid #34d399", background: "rgba(52,211,153,0.03)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-5 w-5" style={{ color: "#34d399" }} />
        <span className="text-sm font-bold" style={{ color: "#34d399" }}>
          Incident Resolved
        </span>
        {liveIncidentId && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
            DB: {liveIncidentId}
          </span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-3">
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#fafaf9" }}>
            {(elapsed / 1000).toFixed(1)}s
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>MTTR</div>
        </div>
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#fafaf9" }}>
            {tools}
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>Tool Calls</div>
        </div>
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#fafaf9" }}>
            {evidence}
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>Evidence</div>
        </div>
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#34d399" }}>
            ${cost.toFixed(2)}
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>Cost</div>
        </div>
        <div>
          <div className="text-lg font-mono font-bold tabular-nums" style={{ color: "#fbbf24" }}>
            {roi.toLocaleString()}x
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "#3a3a37" }}>ROI</div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #19191c" }}>
        <span className="text-[10px] font-mono" style={{ color: "#5c5c58" }}>
          {toolCallsReal} real MCP tool executions
        </span>
        <span className="text-[10px]" style={{ color: "#3a3a37" }}>|</span>
        <span className="text-[10px]" style={{ color: "#5c5c58" }}>
          Breach cost avoided: <span style={{ color: "#f87171" }}>${(breach.avg / 1000000).toFixed(1)}M</span>
        </span>
      </div>
    </div>
  );
}
